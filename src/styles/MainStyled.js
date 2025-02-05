import styled from "styled-components";

export const Container = styled.div`
    display: flex;
`

export const SelectPart = styled.div`
    width: 30%;
`

export const TimeTablePart = styled.div`
    
`

export const WorkerDetails = styled.div`
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #ddd;
  background-color: #f9f9f9;

  h3 {
    margin-bottom: 10px;
  }

  label {
    display: block;
    margin-bottom: 10px;
  }

  input {
    padding: 5px;
    margin-right: 10px;
  }

  button {
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
  }

  button:hover {
    background-color: #45a049;
  }
`;

export const WorkerList = styled.div`
  margin-top: 20px;
  padding: 10px;
  background-color: #f0f0f0;
`;

export const WorkerItem = styled.div`
  padding: 5px;
  margin: 5px 0;
  background-color: #fff;
  border: 1px solid #ccc;
  cursor: pointer;
  display: flex;
  justify-content: space-between;

  &:hover {
    background-color: #e0e0e0;
  }
`;
