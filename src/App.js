import './App.css';
import * as S from './styles/MainStyled';
import TimeSelect from './components/TimeSelect';
import WorkerManager from './components/WorkerManager';
import { useState } from 'react';

function App() {
  const [schedule, setSchedule] = useState([]); // 30분 단위로 저장된 시간
  const [workers, setWorkers] = useState([]);
  const [isScheduleSet, setIsScheduleSet] = useState(false);
  const [possibleSchedules, setPossibleSchedules] = useState([]);

  // 사무실 근무 시간 업데이트
  const handleSetSchedule = (newSchedule) => {
    setSchedule(newSchedule); // 30분 단위로 선택된 시간 저장
  };

  // 근로자 추가
  const handleAddWorker = (worker) => {
    setWorkers((prevWorkers) => [...prevWorkers, worker]);
  };

  // 근로자 수정
  const handleUpdateWorker = (index, updatedWorker) => {
    setWorkers((prevWorkers) =>
      prevWorkers.map((worker, idx) =>
        idx === index ? updatedWorker : worker
      )
    );
  };

  // 사무실 근무 시간 설정 후 확인
  const handleConfirmOfficeHours = () => {
    setIsScheduleSet(true);
  };

  // 가능한 모든 시간표를 생성하는 함수
  const generateSchedules = () => {
    console.log("⏳ 시간표 생성 시작...");

    const totalWorkerHours = workers.reduce((sum, worker) => sum + (Number(worker.attendanceCount) || 0), 0);

    if (schedule.length / 2 !== totalWorkerHours) {
        alert(`사무실 총 근무시간: ${schedule.length / 2} 근로 학생들의 주 근무시간 총합: ${totalWorkerHours}이 일치하지 않습니다.`);
        return;
    }

    const result = [];  // 가능한 시간표 저장 배열
    const assignment = new Array(schedule.length).fill(null);
    const workerHoursMap = {};
    const workerShiftCount = {};  // 하루 내 연속되지 않은 근무 횟수 관리

    workers.forEach(worker => {
        workerHoursMap[worker.name] = 0;
        workerShiftCount[worker.name] = {};
    });

    const startTime = new Date(2025, 0, 6, 10, 0).getTime();
    const timeSlotSize = 30 * 60 * 1000;

    const workerAvailability = {};
    workers.forEach(worker => {
        workerAvailability[worker.name] = worker.schedule.map(time => {
            const dateObj = time instanceof Date ? time : new Date(time);
            const timeDiff = dateObj.getTime() - startTime;
            return timeDiff / timeSlotSize + 1;
        });
    });

    function backtrack(index) {
        if (index === schedule.length) {
            if (!assignment.includes(null) && !assignment.includes("근무 가능자 없음")) {
                const scheduleCopy = [...assignment];
                result.push(scheduleCopy);
            }
            return;
        }

        const currentSlotIndex = schedule[index];
        const currentDay = Math.floor((currentSlotIndex - 1) / (24 * 2));

        let availableWorkers = [];

        for (let worker of workers) {
            const workHours = workerHoursMap[worker.name];
            const isAvailable = workerAvailability[worker.name].includes(currentSlotIndex);
            const hasRemainingHours = workHours < worker.attendanceCount;
            const shiftCount = workerShiftCount[worker.name][currentDay] || 0;

            if (isAvailable && hasRemainingHours && shiftCount < 2) {
                availableWorkers.push(worker);
            }
        }

        let assigned = false;
        for (let worker of availableWorkers) {
            const previousWorker = index > 0 ? assignment[index - 1] : null;
            const shiftCount = workerShiftCount[worker.name][currentDay] || 0;
            const isNewShift = previousWorker !== worker.name;

            if (!isNewShift || shiftCount < 2) {
                assignment[index] = worker.name;
                workerHoursMap[worker.name] += 0.5;
                if (isNewShift) workerShiftCount[worker.name][currentDay] = shiftCount + 1;

                backtrack(index + 1);

                assignment[index] = null;
                workerHoursMap[worker.name] -= 0.5;
                if (isNewShift) workerShiftCount[worker.name][currentDay] = shiftCount;
                assigned = true;
            }
        }

        if (!assigned) {
            assignment[index] = "근무 가능자 없음";
            backtrack(index + 1);
            assignment[index] = null;
        }
    }

    backtrack(0);

    console.log(`✅ 총 생성된 시간표 개수: ${result.length}`);

    // 출근 횟수 계산 함수
    function calculateTotalShifts(schedule) {
        const shiftMap = {};
        let totalShifts = 0;

        for (let i = 0; i < schedule.length; i++) {
            const worker = schedule[i];
            if (worker && worker !== "근무 가능자 없음") {
                const day = Math.floor((schedule[i] - 1) / (24 * 2));

                if (!shiftMap[worker]) shiftMap[worker] = {};
                if (!shiftMap[worker][day]) {
                    shiftMap[worker][day] = true;
                    totalShifts++;
                }
            }
        }
        return totalShifts;
    }

    // 출근 횟수를 기준으로 정렬 후 최대 10개 선택
    const sortedSchedules = result
        .map(schedule => ({ schedule, shifts: calculateTotalShifts(schedule) }))
        .sort((a, b) => a.shifts - b.shifts)  // 출근 횟수가 적은 순으로 정렬
        .slice(0, 10)  // 최대 10개 선택
        .map(item => item.schedule);

    console.log(`✅ 최종 출력할 시간표 개수: ${sortedSchedules.length}`);

    setPossibleSchedules(sortedSchedules.length > 0 ? sortedSchedules : [assignment]);
};


  
  return (
    <S.Container>
      <S.SelectPart>
        <h3>SW교육원 근로 시간표 짜기</h3>
        {!isScheduleSet ? (
          <>
            <h4>사무실 총 근무 시간 설정</h4>
            <TimeSelect 
              schedule={schedule}
              onSetSchedule={handleSetSchedule}
              onConfirm={handleConfirmOfficeHours}
            />
          </>
        ) : (
          <>
            <h4>근로자 관리</h4>
            <WorkerManager
              workers={workers}
              onAddWorker={handleAddWorker}
              onUpdateWorker={handleUpdateWorker}
              schedule={schedule}
            />
            <button onClick={generateSchedules}>시간표 생성</button>
          </>
        )}
      </S.SelectPart>

      <S.TimeTablePart>
  <h3>추천 시간표</h3>
  {possibleSchedules.length > 0 ? (
    possibleSchedules.map((scheduleVariant, idx) => (
      <div key={idx}>
        <h4>가능한 시간표 {idx + 1}</h4>
        <table border="1">
          <thead>
            <tr>
              <th>시간</th>
              {workers.map((worker, wIdx) => (
                <th key={wIdx}>{worker.name}</th>
              ))}
              <th>근무 가능자 없음</th>
            </tr>
          </thead>
          <tbody>
  {schedule.map((timeSlot, tIdx) => {
    const displayTime = new Date(2025, 0, 6, 10, 0);
    displayTime.setMinutes(displayTime.getMinutes() + (timeSlot - 1) * 30);
    const timeString = displayTime.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    return (
      <tr key={tIdx}>
        <td>{timeString}</td>
        {workers.map((worker, wIdx) => (
          <td key={wIdx} style={{ backgroundColor: scheduleVariant[tIdx] === worker.name ? "#D4EDDA" : "inherit" }}>
            {scheduleVariant[tIdx] === worker.name ? "✔" : ""}
          </td>
        ))}
        <td style={{ backgroundColor: scheduleVariant[tIdx] === "근무 가능자 없음" ? "#F8D7DA" : "inherit" }}>
          {scheduleVariant[tIdx] === "근무 가능자 없음" ? "⚠️ 없음" : ""}
        </td>
      </tr>
    );
  })}
</tbody>

        </table>
      </div>
    ))
  ) : (
    <p>시간표를 생성해주세요.</p>
  )}
</S.TimeTablePart>


    </S.Container>
  );
}

export default App;
