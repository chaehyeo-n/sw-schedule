import React from 'react';
import * as S from '../styles/MainStyled';

const TimeTable = ({ schedule, possibleSchedules, selectedScheduleIndex, setSelectedScheduleIndex, workers, workerColors }) => {
  const daysOfWeek = ["월", "화", "수", "목", "금"];

  // ① 각 요일별 슬롯 개수를 바탕으로 전체 슬롯수와 요일별 오프셋 계산
  const dayOffsets = [];
  let totalSlots = 0;
  const maxSlots = daysOfWeek.reduce((max, _, d) => {
    const slots = schedule[d] ? schedule[d].length : 0;
    dayOffsets[d] = totalSlots;
    totalSlots += slots;
    return Math.max(max, slots);
  }, 0);

  // ② 주어진 슬롯 번호를 시간 문자열(예: "10:00", "10:30" 등)로 변환하는 함수  
  //     (기준 시간은 2025-01-06 10:00, 즉 월요일 기준)
  const getFormattedTime = (slot) => {
    const baseTime = new Date(2025, 0, 6, 10, 0);
    baseTime.setMinutes(baseTime.getMinutes() + (slot - 1) * 30);
    return baseTime.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  // ③ 근무자 통계 계산 (flat한 추천 시간표에서 요일별 오프셋을 활용)
  const workerStats = workers.map(worker => {
    let totalWorkTime = 0;
    let workDaysCount = 0;
    let lastDay = null;
    const flatSchedule = possibleSchedules[selectedScheduleIndex] || [];
    for (let i = 0; i < flatSchedule.length; i++) {
      // i가 속한 요일 찾기
      let day = null;
      for (let d = 0; d < daysOfWeek.length; d++) {
        const start = dayOffsets[d];
        const end = start + (schedule[d] ? schedule[d].length : 0);
        if (i >= start && i < end) {
          day = d;
          break;
        }
      }
      if (flatSchedule[i] === worker.name) {
        totalWorkTime += 0.5;
        if (day !== lastDay) {
          workDaysCount += 1;
          lastDay = day;
        }
      }
    }
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
          {/* 시간표 선택 버튼 */}
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

          {/* 추천 시간표 테이블 */}
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
              {Array.from({ length: maxSlots }).map((_, rowIdx) => (
                <tr key={rowIdx}>
                  {/* 첫 번째 열: 기준(월요일)의 시간 슬롯 표시 (없으면 공백) */}
                  <td>
                    {schedule[0] && schedule[0][rowIdx] ? getFormattedTime(schedule[0][rowIdx]) : ""}
                  </td>
                  {/* 각 요일별 셀 */}
                  {daysOfWeek.map((_, d) => {
                    const daySlots = schedule[d] || [];
                    let cellContent = "";
                    if (rowIdx < daySlots.length) {
                      // flat한 추천 시간표에서 해당 셀의 인덱스 계산
                      const flatIndex = dayOffsets[d] + rowIdx;
                      const assignment = possibleSchedules[selectedScheduleIndex]
                        ? possibleSchedules[selectedScheduleIndex][flatIndex]
                        : null;
                      cellContent = assignment || "";
                    }
                    return (
                      <td key={d} style={{
                        backgroundColor: cellContent && cellContent !== "근무 가능자 없음"
                          ? workerColors[workers.findIndex(w => w.name === cellContent) % workerColors.length]
                          : (cellContent === "근무 가능자 없음" ? "#F8D7DA" : "inherit")
                      }}>
                        {cellContent}
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
};

export default TimeTable;