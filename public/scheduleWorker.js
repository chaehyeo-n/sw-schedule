self.onmessage = function(event) {
    const { schedule, workers } = event.data;
    const daysOfWeek = ["월", "화", "수", "목", "금"];
    const slotsPerDay = schedule.length;
    const totalSlots = slotsPerDay * daysOfWeek.length;
    const totalWorkerHours = workers.reduce(
      (sum, worker) => sum + Number(worker.attendanceCount),
      0
    );
  
    // 기본 조건 확인: 총 사무실 근무시간과 근로자들의 주 근무시간 합이 일치해야 함.
    if (totalSlots / 2 !== totalWorkerHours) {
      self.postMessage({ 
        error: `사무실 총 근무시간: ${totalSlots / 2} 시간, 근로 학생들의 주 근무시간 총합: ${totalWorkerHours} 시간이 일치하지 않습니다.` 
      });
      return;
    }
  
    // 1. 근로자별 가능 시간대 계산
    const workerAvailability = {};
    workers.forEach(worker => {
      workerAvailability[worker.name] = {};
      (worker.schedule || []).forEach(time => {
        const dateObj = new Date(time);
        const jsDay = dateObj.getDay();
        const dayIndex = jsDay - 1; // 월~금: 0~4
        if (dayIndex < 0 || dayIndex >= daysOfWeek.length) return;
        const baseTime = new Date(dateObj);
        baseTime.setHours(10, 0, 0, 0);
        const diffMinutes = (dateObj.getTime() - baseTime.getTime()) / 60000;
        const slot = Math.floor(diffMinutes / 30) + 1;
        if (!workerAvailability[worker.name][dayIndex]) {
          workerAvailability[worker.name][dayIndex] = [];
        }
        if (!workerAvailability[worker.name][dayIndex].includes(slot)) {
          workerAvailability[worker.name][dayIndex].push(slot);
        }
      });
    });
  
    // 2. 각 근로자의 요구 슬롯 수 계산 (attendanceCount * 2)
    const requiredSlots = {};
    workers.forEach(worker => {
      requiredSlots[worker.name] = Number(worker.attendanceCount) * 2;
    });
  
    // 3. 각 요일-시간 슬롯별 정적 후보군 미리 계산
    const staticCandidates = {};
    for (let day = 0; day < daysOfWeek.length; day++) {
      for (let j = 0; j < slotsPerDay; j++) {
        const timeSlot = schedule[j];
        staticCandidates[`${day}-${timeSlot}`] = workers.filter(worker => {
          const avail = workerAvailability[worker.name][day];
          return avail && avail.includes(timeSlot);
        });
      }
    }
  
    // 함수: 미래 슬롯에서 후보 옵션 수 계산 (Least Constraining Value)
    const countFutureOptions = (candidate, currentIndex) => {
      let count = 0;
      for (let j = currentIndex + 1; j < totalSlots; j++) {
        const futureDay = Math.floor(j / slotsPerDay);
        const futureSlot = schedule[j % slotsPerDay];
        const futureCandidates = staticCandidates[`${futureDay}-${futureSlot}`] || [];
        if (futureCandidates.some(worker => worker.name === candidate.name)) {
          count++;
        }
      }
      return count;
    };
  
    // 4. 백트래킹 준비
    const assignment = new Array(totalSlots).fill(null);
    const solutions = [];
    const solutionSet = new Set();
    const workerSlots = {};
    workers.forEach(worker => {
      workerSlots[worker.name] = 0;
    });
  
    let bestThreshold = Infinity;
    const memo = new Map();
  
    // 하한 함수: 남은 요일 수를 고려하여 최소 추가 비용 계산
    const lowerBound = (i, currentCost) => {
      const day = Math.floor(i / slotsPerDay);
      let lb = currentCost;
      if (i % slotsPerDay === 0) {
        lb += 1;
      }
      lb += (daysOfWeek.length - day - 1);
      return lb;
    };
  
    // 백트래킹 재귀 함수
    const backtrack = (i, currentCost, lastWorker) => {
      const memoKey = `${i}|${lastWorker || 'null'}|${workers.map(w => workerSlots[w.name]).join(',')}`;
      if (memo.has(memoKey) && memo.get(memoKey) <= currentCost) {
        return;
      }
      memo.set(memoKey, currentCost);
  
      if (lowerBound(i, currentCost) > bestThreshold) {
        return;
      }
  
      // 모든 슬롯 배정이 완료된 경우
      if (i === totalSlots) {
        const key = assignment.join('|');
        if (!solutionSet.has(key)) {
          solutionSet.add(key);
          const unavailableCount = assignment.filter(slot => slot === "근무 가능자 없음").length;
          solutions.push({
            schedule: [...assignment],
            totalShift: currentCost,
            unavailableCount
          });
          // 정렬: "근무 가능자 없음" 칸의 개수가 적은 순, 그 다음 총 shift가 적은 순
          solutions.sort((a, b) => {
            if (a.unavailableCount !== b.unavailableCount) {
              return a.unavailableCount - b.unavailableCount;
            }
            return a.totalShift - b.totalShift;
          });
          if (solutions.length > 10) {
            solutions.pop();
          }
          bestThreshold = solutions.length === 10 ? solutions[solutions.length - 1].totalShift : Infinity;
        }
        return;
      }
  
      const day = Math.floor(i / slotsPerDay);
      const slotInDay = i % slotsPerDay;
      const currentSlot = schedule[slotInDay];
  
      const availableWorkers = staticCandidates[`${day}-${currentSlot}`] || [];
      const candidates = availableWorkers.filter(worker => workerSlots[worker.name] < requiredSlots[worker.name]);
  
      // 후보가 없으면 "근무 가능자 없음"으로 처리
      if (candidates.length === 0) {
        assignment[i] = "근무 가능자 없음";
        backtrack(i + 1, currentCost + 1000, null);
        assignment[i] = null;
        return;
      }
  
      // 후보가 단 한 명이면 바로 배정
      if (candidates.length === 1) {
        const candidate = candidates[0];
        workerSlots[candidate.name] += 1;
        assignment[i] = candidate.name;
        const nextLast = (slotInDay === slotsPerDay - 1) ? null : candidate.name;
        backtrack(i + 1, currentCost + 1, nextLast);
        workerSlots[candidate.name] -= 1;
        assignment[i] = null;
        return;
      }
  
      // 후보가 여러 명인 경우: 여러 기준(직전 근로자 우선, 미래 선택지 수, 남은 필요 슬롯 수)을 고려해 정렬
      candidates.sort((a, b) => {
        if (a.name === lastWorker && b.name !== lastWorker) return -1;
        if (b.name === lastWorker && a.name !== lastWorker) return 1;
        const futureA = countFutureOptions(a, i);
        const futureB = countFutureOptions(b, i);
        if (futureA !== futureB) {
          return futureB - futureA;
        }
        const remainingA = requiredSlots[a.name] - workerSlots[a.name];
        const remainingB = requiredSlots[b.name] - workerSlots[b.name];
        return remainingB - remainingA;
      });
  
      // 각 후보에 대해 시도
      for (let candidate of candidates) {
        const addCost = (slotInDay === 0 || candidate.name !== lastWorker) ? 1 : 0;
        const newCost = currentCost + addCost;
        workerSlots[candidate.name] += 1;
        assignment[i] = candidate.name;
        const nextLast = (slotInDay === slotsPerDay - 1) ? null : candidate.name;
        backtrack(i + 1, newCost, nextLast);
        workerSlots[candidate.name] -= 1;
        assignment[i] = null;
      }
    };
  
    backtrack(0, 0, null);
    const topSchedules = solutions.map(sol => sol.schedule);
    self.postMessage({ topSchedules });
  };
  