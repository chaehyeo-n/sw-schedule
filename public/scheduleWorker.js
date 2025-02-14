self.onmessage = function(event) {
  const { schedule, workers } = event.data;
  const daysOfWeek = ["월", "화", "수", "목", "금"];

  // 각 요일별 사무실 슬롯 수 합산
  let totalSlots = 0;
  for (let day = 0; day < daysOfWeek.length; day++) {
    const slotsForDay = schedule[day] || [];
    totalSlots += slotsForDay.length;
  }

  const totalWorkerHours = workers.reduce(
    (sum, worker) => sum + Number(worker.attendanceCount),
    0
  );

  // 각 슬롯은 30분이므로, 총 슬롯수/2 시간이 근로 학생 주 근무시간 합과 일치해야 함
  if (totalSlots / 2 !== totalWorkerHours) {
    self.postMessage({ 
      error: `사무실 총 근무시간: ${totalSlots / 2} 시간, 근로 학생들의 주 근무시간 총합: ${totalWorkerHours} 시간이 일치하지 않습니다.` 
    });
    return;
  }

  // 각 요일별 최소/최대 슬롯 번호 계산 (isSingleSlotAllowed 최적화용)
  const dayMinMax = {};
  for (let day = 0; day < daysOfWeek.length; day++) {
    const slotsForDay = schedule[day] || [];
    if (slotsForDay.length > 0) {
      dayMinMax[day] = {
        min: Math.min(...slotsForDay),
        max: Math.max(...slotsForDay)
      };
    } else {
      dayMinMax[day] = { min: null, max: null };
    }
  }

  // 1. 근로자별 가능 시간대 계산
  const workerAvailability = {};
  workers.forEach(worker => {
    workerAvailability[worker.name] = {};
    (worker.schedule || []).forEach(time => {
      const dateObj = new Date(time);
      const jsDay = dateObj.getDay();
      const dayIndex = jsDay - 1; // 월~금: 0~4
      if (dayIndex < 0 || dayIndex > 4) return;
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
    const slotsForDay = schedule[day] || [];
    for (let j = 0; j < slotsForDay.length; j++) {
      const timeSlot = slotsForDay[j];
      staticCandidates[`${day}-${timeSlot}`] = workers.filter(worker => {
        const avail = workerAvailability[worker.name][day];
        return avail && avail.includes(timeSlot);
      });
    }
  }

  // countFutureOptions 결과 캐시
  const futureOptionsCache = new Map();
  const countFutureOptions = (candidate, currentIndex, flattenedSchedule) => {
    const cacheKey = `${candidate.name}|${currentIndex}`;
    if (futureOptionsCache.has(cacheKey)) {
      return futureOptionsCache.get(cacheKey);
    }
    let count = 0;
    for (let j = currentIndex + 1; j < flattenedSchedule.length; j++) {
      const { day, slot } = flattenedSchedule[j];
      const futureCandidates = staticCandidates[`${day}-${slot}`] || [];
      if (futureCandidates.some(worker => worker.name === candidate.name)) {
        count++;
      }
    }
    futureOptionsCache.set(cacheKey, count);
    return count;
  };

  // ─────────────────────────────────────────────
  // 한 슬롯만 배정 가능한지 검사 (해당 시간대 유일 후보 & 인접 슬롯 가능성 없음)
  const isSingleSlotAllowed = (workerName, day, slot) => {
    const candidatesForSlot = staticCandidates[`${day}-${slot}`] || [];
    if (candidatesForSlot.length !== 1 || candidatesForSlot[0].name !== workerName) return false;
    const avail = workerAvailability[workerName][day] || [];
    const { min, max } = dayMinMax[day];
    if (min !== null && slot > min && avail.includes(slot - 1)) return false;
    if (max !== null && slot < max && avail.includes(slot + 1)) return false;
    return true;
  };
  // ─────────────────────────────────────────────

  // 사무실 스케줄(요일별)을 단일 배열(flattenedSchedule)로 변환
  const flattenedSchedule = [];
  for (let day = 0; day < daysOfWeek.length; day++) {
    const slotsForDay = schedule[day] || [];
    for (let j = 0; j < slotsForDay.length; j++) {
      flattenedSchedule.push({ day, slot: slotsForDay[j] });
    }
  }

  // 백트래킹 준비
  const assignment = new Array(flattenedSchedule.length).fill(null);
  const solutions = [];
  const solutionSet = new Set();
  const workerSlots = {};
  workers.forEach(worker => {
    workerSlots[worker.name] = 0;
  });

  let bestThreshold = Infinity;
  const memo = new Map();

  const lowerBound = (i, currentCost) => {
    if (i >= flattenedSchedule.length) return currentCost;
    const currentDay = flattenedSchedule[i].day;
    let lb = currentCost;
    // 현재 슬롯이 해당 날의 첫 슬롯이면 추가 비용
    if (i === 0 || flattenedSchedule[i-1].day !== currentDay) {
      lb += 1;
    }
    lb += (daysOfWeek.length - currentDay - 1);
    return lb;
  };

  // 백트래킹 재귀 함수
  const backtrack = (i, currentCost, lastWorker, currentShiftCount) => {
    if (i > 0 && flattenedSchedule[i-1].day !== flattenedSchedule[i]?.day) {
      // 새 날 시작: 이전 날 마지막 블록 검증
      const prevDay = flattenedSchedule[i-1].day;
      if (lastWorker !== null && currentShiftCount === 1) {
        if (!isSingleSlotAllowed(lastWorker, prevDay, flattenedSchedule[i-1].slot)) {
          return;
        }
      }
      lastWorker = null;
      currentShiftCount = 0;
    }

    const memoKey = `${i}|${lastWorker || 'null'}|${workers.map(w => workerSlots[w.name]).join(',')}|${currentShiftCount}`;
    if (memo.has(memoKey) && memo.get(memoKey) <= currentCost) {
      return;
    }
    memo.set(memoKey, currentCost);

    if (lowerBound(i, currentCost) > bestThreshold) {
      return;
    }

    if (i === flattenedSchedule.length) {
      // 모든 슬롯 배정 완료 시 마지막 블록 검증
      if (lastWorker !== null && currentShiftCount === 1) {
        const last = flattenedSchedule[i-1];
        if (!isSingleSlotAllowed(lastWorker, last.day, last.slot)) {
          return;
        }
      }
      const key = assignment.join('|');
      if (!solutionSet.has(key)) {
        solutionSet.add(key);
        const unavailableCount = assignment.filter(slot => slot === "근무 가능자 없음").length;
        solutions.push({
          schedule: [...assignment],
          totalShift: currentCost,
          unavailableCount
        });
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

    const { day, slot } = flattenedSchedule[i];
    const availableWorkers = staticCandidates[`${day}-${slot}`] || [];
    const candidates = availableWorkers.filter(worker => workerSlots[worker.name] < requiredSlots[worker.name]);

    if (candidates.length === 0) {
      if (lastWorker !== null && currentShiftCount === 1) {
        if (!isSingleSlotAllowed(lastWorker, day, flattenedSchedule[i-1].slot)) {
          return;
        }
      }
      assignment[i] = "근무 가능자 없음";
      backtrack(i + 1, currentCost + 1000, null, 0);
      assignment[i] = null;
      return;
    }

    if (candidates.length === 1) {
      const candidate = candidates[0];
      if (lastWorker !== null && candidate.name !== lastWorker && currentShiftCount === 1) {
        if (!isSingleSlotAllowed(lastWorker, day, flattenedSchedule[i-1].slot)) {
          return;
        }
      }
      workerSlots[candidate.name] += 1;
      assignment[i] = candidate.name;
      const nextShiftCount = (candidate.name === lastWorker) ? currentShiftCount + 1 : 1;
      const nextLast = (i === flattenedSchedule.length - 1 || flattenedSchedule[i+1].day !== day) ? null : candidate.name;
      backtrack(i + 1, currentCost + ((i === 0 || candidate.name !== lastWorker) ? 1 : 0), nextLast, nextShiftCount);
      workerSlots[candidate.name] -= 1;
      assignment[i] = null;
      return;
    }

    candidates.sort((a, b) => {
      if (a.name === lastWorker && b.name !== lastWorker) return -1;
      if (b.name === lastWorker && a.name !== lastWorker) return 1;
      const futureA = countFutureOptions(a, i, flattenedSchedule);
      const futureB = countFutureOptions(b, i, flattenedSchedule);
      if (futureA !== futureB) {
        return futureB - futureA;
      }
      const remainingA = requiredSlots[a.name] - workerSlots[a.name];
      const remainingB = requiredSlots[b.name] - workerSlots[b.name];
      return remainingB - remainingA;
    });

    for (let candidate of candidates) {
      if (lastWorker !== null && candidate.name !== lastWorker && currentShiftCount === 1) {
        if (!isSingleSlotAllowed(lastWorker, day, flattenedSchedule[i-1].slot)) {
          continue;
        }
      }
      const addCost = (i === 0 || candidate.name !== lastWorker) ? 1 : 0;
      const newCost = currentCost + addCost;
      workerSlots[candidate.name] += 1;
      assignment[i] = candidate.name;
      const nextShiftCount = (candidate.name === lastWorker) ? currentShiftCount + 1 : 1;
      const nextLast = (i === flattenedSchedule.length - 1 || flattenedSchedule[i+1].day !== day) ? null : candidate.name;
      backtrack(i + 1, newCost, nextLast, nextShiftCount);
      workerSlots[candidate.name] -= 1;
      assignment[i] = null;
    }
  };

  backtrack(0, 0, null, 0);
  const topSchedules = solutions.map(sol => sol.schedule);
  self.postMessage({ topSchedules });
};
