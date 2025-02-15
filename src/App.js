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

  const workerColors = [
    "#D4EDDA", "#C1E1FF", "#FFE0B3", "#D1C4E9", "#F1C0A9", "#FFB6C1", "#F8D7DA"
  ];

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
    <>
      <S.Container>
        <S.SelectPart>
          <h1>SW교육원 근로 시간표 생성기</h1>
          {!isScheduleSet ? (
            <>
              <h2>사무실 총 근무 시간 설정</h2>
              <TimeSelect 
                schedule={schedule}
                onSetSchedule={setSchedule}
                onConfirm={() => setIsScheduleSet(true)}
              />
            </>
          ) : (
            <>
              <h2>근로자 관리</h2>
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
              <S.Buttons>
                <S.StyledButton onClick={generateSchedules}>시간표 생성</S.StyledButton>
              </S.Buttons>
            </>
          )}
        </S.SelectPart>

        <S.TimeTablePart>
          <TimeTable 
            schedule={schedule}
            possibleSchedules={possibleSchedules}
            selectedScheduleIndex={selectedScheduleIndex}
            setSelectedScheduleIndex={setSelectedScheduleIndex}
            workers={workers}
            workerColors={workerColors}
          />
        </S.TimeTablePart>
      </S.Container>
      <S.Footer>
        <p>@chaehyeo-n</p>
      </S.Footer>
    </>
  );
}

export default App;
