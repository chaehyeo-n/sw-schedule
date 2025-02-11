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

  // 근무자들의 이름, 주 근무 시간, 출근 횟수 계산 (연속된 근무는 1회 출근으로 계산)
  const workerStats = workers.map(worker => {
    let totalWorkTime = 0; // 주 근무 시간
    let workDaysCount = 0; // 출근 횟수
    let isWorkingToday = false; // 근무 중 여부 (연속된 근무 처리)

    possibleSchedules[selectedScheduleIndex]?.forEach((scheduleSlot, index) => {
      const day = Math.floor(index / schedule.length); // 요일 인덱스
      const timeSlot = index % schedule.length; // 시간 슬롯 인덱스

      if (scheduleSlot === worker.name) {
        totalWorkTime += 0.5; // 한 슬롯은 30분, 따라서 0.5시간으로 계산

        // 연속된 근무는 하나의 출근으로 치기 위해 확인
        if (!isWorkingToday) {
          workDaysCount += 1; // 새로운 출근을 시작
          isWorkingToday = true; // 현재 근무 중으로 설정
        }
      } else {
        isWorkingToday = false; // 연속 근무가 끊어졌으므로 다시 초기화
      }
    });

    return {
      name: worker.name,
      totalWorkTime,
      workDaysCount
    };
  });

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

          {/* 근무자 통계 표 */}
          <h3>근무자 통계</h3>
          <table border="1">
            <thead>
              <tr>
                <th>항목</th>
                {workerStats.map((worker, idx) => (
                  <th key={idx}>{worker.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>주 근무 시간 (시간)</td>
                {workerStats.map((worker, idx) => (
                  <td key={idx}>{worker.totalWorkTime}</td>
                ))}
              </tr>
              <tr>
                <td>출근 횟수</td>
                {workerStats.map((worker, idx) => (
                  <td key={idx}>{worker.workDaysCount}</td>
                ))}
              </tr>
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
