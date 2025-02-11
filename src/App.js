import { useState } from 'react';
import './App.css';
import * as S from './styles/MainStyled';
import TimeSelect from './components/TimeSelect';
import WorkerManager from './components/WorkerManager';

function App() {
  // 상태 정의
  const [schedule, setSchedule] = useState([]);           // 한 날의 슬롯 배열 (예: [1,2,3,...])
  const [workers, setWorkers] = useState([]);               // 근로자 목록
  const [isScheduleSet, setIsScheduleSet] = useState(false);  
  const [possibleSchedules, setPossibleSchedules] = useState([]); // 최종 추천 시간표 (배정 배열)
  const [selectedScheduleIndex, setSelectedScheduleIndex] = useState(0); // 선택된 시간표

  const daysOfWeek = ["월", "화", "수", "목", "금"];

  const workerColors = [
    "#D4EDDA", "#C1E1FF", "#FFE0B3", "#F8D7DA", "#F1C0A9", "#D1C4E9"
  ];

  // 한 날의 시간대를 포맷 (예: 10:00, 10:30, 11:00, …)
  const getFormattedTime = (timeSlot) => {
    const baseTime = new Date(2025, 0, 6, 10, 0); // 기준 시작 시간: 10:00
    baseTime.setMinutes(baseTime.getMinutes() + (timeSlot - 1) * 30);
    return baseTime.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  // ★ 완벽한 조건을 만족하는 시간표 생성 (Branch-and-Bound 백트래킹) ★
  // 조건:
  // 1. 각 슬롯에는 해당 시간대에 근무 가능한 근로자 중 한 명을 배정하거나,
  //    후보가 없으면 "근무 가능자 없음"을 표시
  // 2. 각 근로자는 attendanceCount * 2 슬롯 이상 배정되지 않음.
  // 3. 사무실 근무 시간(슬롯 수/2)과 근로 학생들의 주 근무시간 총합이 일치해야 함.
  // 4. 모든 슬롯 배정이 완료되면(일부 슬롯은 "근무 가능자 없음"일 수 있음)
  //    총 shift(출근 횟수)가 최소인 순으로 최대 10개 추천.
  const generateSchedules = () => {
    console.log("⏳ 시간표 생성 시작...");
  
    const slotsPerDay = schedule.length;
    const totalSlots = slotsPerDay * daysOfWeek.length;
    const totalWorkerHours = workers.reduce(
      (sum, worker) => sum + Number(worker.attendanceCount),
      0
    );
  
    // 기본 조건 확인
    if (totalSlots / 2 !== totalWorkerHours) {
      alert(
        `사무실 총 근무시간: ${totalSlots / 2} 시간, 근로 학생들의 주 근무시간 총합: ${totalWorkerHours} 시간이 일치하지 않습니다.`
      );
      return;
    }
  
    // 1. 근로자 별 가능 시간대 준비
    const workerAvailability = {};
    workers.forEach(worker => {
      workerAvailability[worker.name] = {};
      worker.schedule.forEach(time => {
        const dateObj = time instanceof Date ? time : new Date(time);
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
  
    console.log("근로자별 가능 시간대:", workerAvailability);
  
    // 2. 각 근로자의 요구 슬롯 수 계산
    const requiredSlots = {};
    workers.forEach(worker => {
      requiredSlots[worker.name] = Number(worker.attendanceCount) * 2;
    });
  
    console.log("근로자별 요구 슬롯 수:", requiredSlots);
  
    // 3. 기본 변수 설정
    const assignment = new Array(totalSlots).fill(null);
    const solutions = [];
    const solutionSet = new Set();
    const workerSlots = {};
    workers.forEach(worker => {
      workerSlots[worker.name] = 0;
    });
  
    let bestThreshold = Infinity;
  
    // 하한값 계산 (가지치기 용)
    const lowerBound = (i, currentCost, lastWorker) => {
      const day = Math.floor(i / slotsPerDay);
      let lb = currentCost;
      if (i % slotsPerDay === 0) {
        lb += 1;
      }
      lb += (daysOfWeek.length - day - 1);
      return lb;
    };
  
    // 백트래킹 함수
    const backtrack = (i, currentCost, lastWorker) => {
      // 가지치기: 하한이 이미 최적 해 상한보다 크면 종료
      if (lowerBound(i, currentCost, lastWorker) > bestThreshold) {
        console.log(`⛔ 가지치기: 하한이 최적 해 상한 초과 (i: ${i}, currentCost: ${currentCost}, lastWorker: ${lastWorker})`);
        return;
      }
  
      // 모든 슬롯 배정 완료
      if (i === totalSlots) {
        const key = assignment.join('|');
        if (!solutionSet.has(key)) {
          solutionSet.add(key);
          solutions.push({ schedule: [...assignment], totalShift: currentCost });
          solutions.sort((a, b) => a.totalShift - b.totalShift);
          if (solutions.length > 10) {
            solutions.pop();
          }
          bestThreshold = solutions.length === 10 ? solutions[solutions.length - 1].totalShift : Infinity;
          console.log(`✅ 완성된 시간표 (총 shift: ${currentCost}):`, assignment);
        }
        return;
      }
  
      const day = Math.floor(i / slotsPerDay);
      const slotInDay = i % slotsPerDay;
      const currentSlot = schedule[slotInDay];
      console.log(`현재 슬롯 (i: ${i}) - 요일: ${daysOfWeek[day]}, 시간: ${getFormattedTime(currentSlot)}`);
  
      // 1. 근무 가능자가 없는 슬롯 처리 (근무 가능자 없음으로 표시)
      const candidates = workers.filter(worker => {
        const avail = workerAvailability[worker.name][day];
        return avail && avail.includes(currentSlot) && workerSlots[worker.name] < requiredSlots[worker.name];
      });
  
      if (candidates.length === 0) {
        console.log(`⛔ 후보 없음: ${daysOfWeek[day]} ${getFormattedTime(currentSlot)}에 근무 가능한 근로자가 없습니다.`);
        assignment[i] = "근무 가능자 없음";
        backtrack(i + 1, currentCost + 1000, null);
        assignment[i] = null;
        return;
      }
  
      // 2. 근무 가능자가 한 명인 경우 빠르게 배정
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
  
      // 3. 후보자가 여러 명인 경우, 비용이 가장 적게 드는 순서로 정렬 후 시도
      candidates.sort((a, b) => {
        if (a.name === lastWorker) return -1;
        if (b.name === lastWorker) return 1;
        return (requiredSlots[b.name] - workerSlots[b.name]) - (requiredSlots[a.name] - workerSlots[a.name]);
      });
  
      for (let candidate of candidates) {
        let addCost = (slotInDay === 0 || candidate.name !== lastWorker) ? 1 : 0;
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
    console.log(`✅ 총 생성된 해 후보 개수: ${solutions.length}`);
  
    const topSchedules = solutions.map(sol => sol.schedule);
    setPossibleSchedules(topSchedules);
    setSelectedScheduleIndex(0);
  };  
  
  return (
    <S.Container>
      <S.SelectPart>
        <h3>SW교육원 근로 시간표 짜기</h3>
        {!isScheduleSet ? (
          <>
            <h4>사무실 총 근무 시간 설정 (한 날의 시간대를 선택하면 주간 시간표로 확장됩니다.)</h4>
            <TimeSelect 
              schedule={schedule}
              onSetSchedule={setSchedule}
              onConfirm={() => setIsScheduleSet(true)}
            />
          </>
        ) : (
          <>
            <h4>근로자 관리</h4>
            <WorkerManager
              workers={workers}
              onAddWorker={(worker) => setWorkers([...workers, worker])}
              onUpdateWorker={(index, updatedWorker) => {
                const updatedWorkers = [...workers];
                updatedWorkers[index] = updatedWorker;
                setWorkers(updatedWorkers);
              }}
              schedule={schedule}
            />
            <button onClick={generateSchedules}>시간표 생성</button>
          </>
        )}
      </S.SelectPart>
  
      <S.TimeTablePart>
        <h3>추천 시간표</h3>
        {possibleSchedules.length > 0 ? (
          <>
            <div>
              {possibleSchedules.map((_, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setSelectedScheduleIndex(idx)}
                  style={{
                    marginRight: '5px',
                    padding: '5px 10px',
                    backgroundColor: selectedScheduleIndex === idx ? '#007bff' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  시간표 {idx + 1}
                </button>
              ))}
            </div>
  
            <table border="1">
              <thead>
                <tr>
                  <th>시간</th>
                  {daysOfWeek.map((day, idx) => (
                    <th key={idx}>{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: schedule.length }).map((_, rowIdx) => (
                  <tr key={rowIdx}>
                    <td>{getFormattedTime(schedule[rowIdx])}</td>
                    {daysOfWeek.map((day, dayIdx) => {
                      const slotIndex = rowIdx + dayIdx * schedule.length;
                      const workerForSlot = possibleSchedules[selectedScheduleIndex]
                        ? possibleSchedules[selectedScheduleIndex][slotIndex]
                        : null;
                      return (
                        <td key={dayIdx} style={{
                          backgroundColor: workerForSlot && workerForSlot !== "근무 가능자 없음"
                            ? workerColors[workers.findIndex(w => w.name === workerForSlot) % workerColors.length]
                            : (workerForSlot === "근무 가능자 없음" ? "#F8D7DA" : "inherit")
                        }}>
                          {workerForSlot || ""}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p>시간표를 생성해주세요.</p>
        )}
      </S.TimeTablePart>
    </S.Container>
  );
}
  
export default App;
