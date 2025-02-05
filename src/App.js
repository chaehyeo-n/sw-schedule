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
    
    const totalWorkerHours = workers.reduce((sum, worker) => sum + parseFloat(worker.attendanceCount), 0);
    
    if (schedule.length / 2 !== totalWorkerHours) {
      alert("사무실 총 근무시간:" + schedule.length / 2 + " 근로 학생들의 주 근무시간 총합:" + totalWorkerHours + "이 일치하지 않습니다.");
      return;
    }
  
    const result = [];
    const assignment = new Array(schedule.length).fill(null);
    const workerHoursMap = {};
  
    workers.forEach(worker => {
      workerHoursMap[worker.name] = 0;
    });
  
    const startTime = new Date(2025, 0, 6, 10, 0).getTime(); // 2025-01-06 10:00
    const timeSlotSize = 30 * 60 * 1000; // 30분 (밀리초)
  
    function backtrack(index) {
      if (index === schedule.length) {
        console.log("🛑 가능한 시간표 발견:", assignment);
        result.push([...assignment]);
        return;
      }
  
      const currentSlotIndex = schedule[index]; // 선택된 시간 인덱스 (1부터 시작)
      const currentSlot = startTime + (currentSlotIndex - 1) * timeSlotSize;
  
      let assigned = false;
  
      for (let worker of workers) {
        const workHours = workerHoursMap[worker.name];
  
        // 🔥 worker.schedule이 Date 객체일 수도 있으므로 인덱스로 변환
        const workerAvailableIndices = worker.schedule.map(time => {
          const timeDiff = new Date(time).getTime() - startTime;
          return timeDiff / timeSlotSize + 1; // 1부터 시작하는 인덱스
        });
  
        if (
          workHours < worker.attendanceCount &&
          workerAvailableIndices.includes(currentSlotIndex) &&
          !assignment.includes(worker.name)
        ) {
          console.log(`✅ ${worker.name} 배정됨 → 시간 인덱스: ${currentSlotIndex}`);
  
          assignment[index] = worker.name;
          workerHoursMap[worker.name] += 0.5;
  
          backtrack(index + 1);
  
          // 배정 취소 (백트래킹)
          assignment[index] = null;
          workerHoursMap[worker.name] -= 0.5;
        }
      }
  
      if (!assigned) {
        console.warn(`⛔ ${currentSlotIndex}번 시간에 배정할 수 있는 근로자가 없음.`);
        assignment[index] = "근무 가능자 없음";
      }
    }
  
    backtrack(0);
  
    if (result.length > 0) {
      console.log(`✅ 시간표 생성 완료, 가능한 조합 개수: ${result.length}`);
    } else {
      console.warn("❌ 가능한 시간표 없음");
    }
  
    setPossibleSchedules(result);
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
                    <td key={wIdx}>
                      {scheduleVariant[tIdx] === worker.name ? "✔" : ""}
                    </td>
                  ))}
                  <td>{scheduleVariant[tIdx] === "근무 가능자 없음" ? "✔" : ""}</td>
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
