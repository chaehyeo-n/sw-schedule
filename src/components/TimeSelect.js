import React from 'react';
import ScheduleSelector from 'react-schedule-selector';
import * as S from '../styles/TimeSelectStyled';

class TimeSelect extends React.Component {
  handleChange = (newSchedule) => {
    const { onSetSchedule } = this.props;
    // 선택된 시간을 요일별로 그룹화 (0: 월, 1: 화, …, 4: 금)
    const groupedSchedule = {};
    newSchedule.forEach(time => {
      const dateObj = new Date(time);
      const jsDay = dateObj.getDay(); // Sunday=0, Monday=1, ...
      const dayIndex = jsDay - 1; // 월~금: 0~4
      if (dayIndex < 0 || dayIndex > 4) return; // 주말 무시
      // 10시 기준으로 30분 단위 슬롯 계산
      const baseTime = new Date(dateObj);
      baseTime.setHours(10, 0, 0, 0);
      const diffMinutes = (dateObj.getTime() - baseTime.getTime()) / 60000;
      const slot = Math.floor(diffMinutes / 30) + 1;
      if (!groupedSchedule[dayIndex]) {
        groupedSchedule[dayIndex] = [];
      }
      if (!groupedSchedule[dayIndex].includes(slot)) {
        groupedSchedule[dayIndex].push(slot);
      }
    });
    // 각 요일별 슬롯을 정렬
    for (let day in groupedSchedule) {
      groupedSchedule[day].sort((a, b) => a - b);
    }
    onSetSchedule(groupedSchedule);
  };

  handleConfirm = () => {
    const { onConfirm } = this.props;
    if (typeof onConfirm === 'function') {
      onConfirm();
    }
  };

  render() {
    const { schedule } = this.props;
    // schedule 객체({0: [...], 1: [...], …})를 Date 객체 배열로 변환하여 ScheduleSelector에 전달
    const selectionDates = [];
    // 기준: 월요일은 2025-01-06 (10시)
    const baseDate = new Date(2025, 0, 6, 10, 0);
    for (let day = 0; day < 5; day++) {
      const slots = schedule[day] || [];
      slots.forEach(slot => {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + day);
        date.setMinutes(date.getMinutes() + (slot - 1) * 30);
        selectionDates.push(date);
      });
    }
    return (
      <div>
        <ScheduleSelector
          selection={selectionDates}
          startDate={'2025-1-6'}
          numDays={5}
          minTime={10}
          maxTime={17}
          dateFormat="ddd"
          timeFormat="H:mm"
          hourlyChunks={2}
          rowGap="2px"
          onChange={this.handleChange}
        />
        <S.Buttons>
          <S.StyledButton onClick={this.handleConfirm}>확인</S.StyledButton>
        </S.Buttons>
      </div>
    );
  }
}

export default TimeSelect;
