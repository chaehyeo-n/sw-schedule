// App.js
import { useState } from 'react';
import './App.css';
import * as S from './styles/MainStyled';
import TimeSelect from './components/TimeSelect';
import WorkerManager from './components/WorkerManager';
import TimeTable from './components/TimeTable';

function App() {
  const [schedule, setSchedule] = useState([]);           // 한 날의 슬롯 배열 (예: [1,2,3,...])
  const [workers, setWorkers] = useState([]);             // 근로자 목록
  const [isScheduleSet, setIsScheduleSet] = useState(false);  
  const [possibleSchedules, setPossibleSchedules] = useState([]); // 최종 추천 시간표 (배정 배열)
  const [selectedScheduleIndex, setSelectedScheduleIndex] = useState(0); // 선택된 시간표

  const daysOfWeek = ["월", "화", "수", "목", "금"];

  const workerColors = [
    "#D4EDDA", "#C1E1FF", "#FFE0B3", "#F8D7DA", "#F1C0A9", "#D1C4E9"
  ];

  const getFormattedTime = (timeSlot) => {
    const baseTime = new Date(2025, 0, 6, 10, 0); // 기준 시작 시간: 10:00
    baseTime.setMinutes(baseTime.getMinutes() + (timeSlot - 1) * 30);
    return baseTime.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  // ★ 최적화된 시간표 생성 (Web Worker 활용) ★
  const generateSchedules = () => {
    console.log("⏳ 시간표 생성 시작...");
    
    // Web Worker 경로 지정 (public 폴더에서 경로를 제공)
    const worker = new Worker(`${process.env.PUBLIC_URL}/scheduleWorker.js`);
    
    // worker에 데이터 전달 (schedule과 workers 데이터를 넘김)
    worker.postMessage({ schedule, workers });
    
    // worker로부터 메시지 수신
    worker.onmessage = (event) => {
      if (event.data.error) {
        alert(event.data.error);
        worker.terminate();
        return;
      }
      const { topSchedules } = event.data;
      console.log(`✅ 총 생성된 해 후보 개수: ${topSchedules.length}`);
      setPossibleSchedules(topSchedules);
      setSelectedScheduleIndex(0);
      worker.terminate();
    };

    worker.onerror = (error) => {
      console.error("Worker error:", error);
      worker.terminate();
    };
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

      <TimeTable 
        schedule={schedule}
        possibleSchedules={possibleSchedules}
        selectedScheduleIndex={selectedScheduleIndex}
        setSelectedScheduleIndex={setSelectedScheduleIndex}
        workers={workers}
        workerColors={workerColors}
      />
    </S.Container>
  );
}

export default App;
