import React, { useState } from 'react';

const WorkForm = ({ onAddWorker }) => {
  const [name, setName] = useState('');
  const [attendanceCount, setAttendanceCount] = useState('');

  const handleAdd = () => {
    if (name && attendanceCount) {
      onAddWorker({ name, attendanceCount: parseInt(attendanceCount, 10) }); // 숫자로 변환
      setName('');
      setAttendanceCount('');
    } else {
      alert('이름과 근무 시간을 입력해주세요.');
    }
  };

  return (
    <div>
      <label>
        이름:
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        주 근무 시간:
        <input
          type="number"
          value={attendanceCount}
          onChange={(e) => setAttendanceCount(e.target.value)}
        />
      </label>
      <button onClick={handleAdd}>추가</button>
    </div>
  );
};

export default WorkForm;
