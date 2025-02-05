import React from 'react';
import ScheduleSelector from 'react-schedule-selector';

class TimeSelect extends React.Component {
  handleChange = (newSchedule) => {
    const { onSetSchedule } = this.props;

    if (typeof onSetSchedule === 'function') {
      const startTime = new Date(2025, 0, 6, 10, 0).getTime(); // 2025-01-06 10:00
      const timeSlotSize = 30 * 60 * 1000; // 30분 (밀리초)
      
      // 선택된 시간들을 인덱스 값으로 변환
      const indexedSchedule = newSchedule.map(time => {
        const timeDiff = new Date(time).getTime() - startTime;
        return timeDiff / timeSlotSize + 1; // 1부터 시작하는 인덱스
      });

      onSetSchedule(indexedSchedule); // 변환된 인덱스 배열 전달
    } else {
      console.error('onSetSchedule is not a function');
    }
  };

  handleConfirm = () => {
    const { onConfirm } = this.props;
    
    if (typeof onConfirm === 'function') {
      onConfirm(); // 부모로 설정 완료 호출
    }
  };

  render() {
    const { schedule } = this.props;

    return (
      <div>
        <ScheduleSelector
          selection={schedule.map(num => 
            new Date(2025, 0, 6, 10, 0).getTime() + (num - 1) * 30 * 60 * 1000
          )}
          startDate={'2025-1-6'}
          numDays={5}
          minTime={10}
          maxTime={17}
          dateFormat="dddd"
          timeFormat="H:mm"
          hourlyChunks={2}
          rowGap="2px"
          onChange={this.handleChange}
        />
        <button onClick={this.handleConfirm}>확인</button>
      </div>
    );
  }
}

export default TimeSelect;
