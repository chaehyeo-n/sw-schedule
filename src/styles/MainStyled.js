import styled from "styled-components";

// 전체 컨테이너 스타일
export const Container = styled.div`
  display: flex;
  margin-left: 3%;
  margin-top: 1%;
  font-family: 'Arial', sans-serif;
  padding: 20px;
  background-color: #fafafa;

  p {
    display: flex;
  }
`;

// 선택 부분 카드 스타일
export const SelectPart = styled.div`
  width: 30%;
  background-color: #fff;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  h1 {
    font-size: 24px;
    margin-bottom: 20px;
    color: #333;
  }

  h2 {
    font-size: 20px;
    color: #555;
    margin-bottom: 15px;
  }
`;

// 시간표 부분 카드 스타일
export const TimeTablePart = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 3%;
  width: 90%;
  background-color: #fff;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  table {
    width: 100%;
    margin-top: 20px;
    border-collapse: collapse;
    text-align: center;
  }

  th, td {
    padding: 12px;
    border: 1px solid #ddd;
    font-size: 14px;
    color: #333;
  }

  th {
    background-color: #007bff;
    color: white;
  }

  td {
    background-color: #f9f9f9;
    transition: background-color 0.3s ease;
  }

  td:hover {
    background-color: #f0f0f0;
  }

  .highlighted {
    background-color: #e7f1ff;
  }

  .no-worker {
    background-color: #F8D7DA;
  }
`;

// 버튼 영역 스타일
export const Buttons = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 20px;
  justify-content: center;
`;

// 스타일링된 버튼
export const StyledButton = styled.button`
  background-color: #6200ea;
  color: white;
  padding: 14px 25px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  width: 100%;
  text-align: center;

  &:hover {
    background-color: #3700b3;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(98, 0, 234, 0.3);
  }
`;

export const Footer = styled.div`
  bottom: 10px;
  right: 10px;
  font-size: 12px;
  color: gray;
  padding: 5px 10px;
  text-align: right;
  margin-top: auto;
`;