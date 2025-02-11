import React from 'react';
import * as S from '../styles/MainStyled';

const TimeTable = ({ schedule, possibleSchedules, selectedScheduleIndex, setSelectedScheduleIndex, workers, workerColors }) => {
  const daysOfWeek = ["월", "화", "수", "목", "금"];

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

  return (
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
  );
}

export default TimeTable;
