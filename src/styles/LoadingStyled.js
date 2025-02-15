import styled from 'styled-components';

export const LoadingContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);  // 배경 어두운 색상, 흐리게
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;  // 다른 콘텐츠 위에 표시되도록 설정
`;

export const LoadingContent = styled.div`
  text-align: center;
  width: 20%;
  color: white;
  padding: 20px;
`;