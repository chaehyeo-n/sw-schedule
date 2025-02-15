import styled from "styled-components";

// 근로자 추가 폼 스타일
export const Forms = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  label {
    font-size: 16px;
    color: #333;
  }

  input {
    padding: 8px 15px;
    margin-top: 5px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 14px;
    width: 90%;
  }
`;

// 근로자 정보 상세보기 스타일
export const WorkerDetails = styled.div`
  margin-top: 10px;
  padding: 15px;
  background-color: #f1f1f1;
  border-radius: 8px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
  
  p {
    margin: 8px 0;
    font-size: 14px;
    color: #555;
  }

  ul {
    list-style: none;
    padding-left: 0;
  }

  li {
    font-size: 14px;
    color: #333;
  }
`;

// 근로자 추가 버튼 스타일
export const Buttons = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

// 근로자 추가 버튼 스타일
export const StyledButton = styled.button`
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #0056b3;
    transform: scale(1.05);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.3);
  }
`;

