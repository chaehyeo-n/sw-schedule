import React, { useState } from 'react';
import ScheduleSelector from 'react-schedule-selector';

const WorkerManager = ({ workers, onAddWorker, onUpdateWorker }) => {
  const [name, setName] = useState('');
  const [attendanceCount, setAttendanceCount] = useState(''); // 근무 가능 시간 입력 (0.5 단위)
  const [workerSchedule, setWorkerSchedule] = useState([]); // 근로자의 개별 근무 시간 저장
  const [selectedWorkerIndex, setSelectedWorkerIndex] = useState(null);

  // 근로자 추가 핸들러
  const handleAddWorker = () => {
    if (name && attendanceCount) {
      const newWorker = { 
        name, 
        attendanceCount: parseFloat(attendanceCount), // 0.5 단위로 변환
        schedule: workerSchedule // 선택한 근무 시간 반영
      };
      onAddWorker(newWorker);
      setName('');
      setAttendanceCount('');
      setWorkerSchedule([]); // 입력 후 초기화
    } else {
      alert('이름과 근무 시간을 입력해주세요.');
    }
  };

  // 근로자 시간대 선택 핸들러
  const toggleWorkerSchedule = (index) => {
    setSelectedWorkerIndex(selectedWorkerIndex === index ? null : index);
  };

  // ScheduleSelector 값 변경 핸들러
  const handleScheduleChange = (newSchedule) => {
    setWorkerSchedule(newSchedule);
  };

  return (
    <div>
      <h3>근무자 관리</h3>
      <label>
        이름:
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        주 근무 시간 (0.5 단위로 입력):
        <input
          type="number"
          value={attendanceCount}
          onChange={(e) => setAttendanceCount(e.target.value)}
          step="0.5" // 0.5 단위로 입력하도록 설정
        />
      </label>
      <div>
        <h4>근로 가능 시간대</h4>
        <ScheduleSelector
          selection={workerSchedule} // 선택한 값 반영
          startDate={'2025-1-6'}
          numDays={5}
          minTime={10}
          maxTime={17}
          dateFormat="dddd"
          timeFormat="H:mm"
          hourlyChunks={2} // 30분 단위로 설정
          rowGap="2px"
          onChange={handleScheduleChange} // 변경 핸들러 연결
        />
      </div>
      <button onClick={handleAddWorker}>근로 학생 추가</button>

      <h4>근로 학생 목록</h4>
      <ul>
        {workers.map((worker, index) => (
          <li key={index}>
            <span 
              style={{ cursor: 'pointer', textDecoration: 'underline', color: 'blue' }} 
              onClick={() => toggleWorkerSchedule(index)}
            >
              {worker.name}
            </span>
            {selectedWorkerIndex === index && (
              <div>
                <p>주 근무 시간: {worker.attendanceCount} 시간</p>
                <p>근무 시간대:</p>
                <ul>
                  {worker.schedule.length > 0 ? (
                    worker.schedule.map((time, i) => <li key={i}>{new Date(time).toLocaleString()}</li>) // Date 객체를 문자열로 변환
                  ) : (
                    <li>시간 미설정</li>
                  )}
                </ul>
                <button onClick={() => onUpdateWorker(index)}>수정</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WorkerManager;
