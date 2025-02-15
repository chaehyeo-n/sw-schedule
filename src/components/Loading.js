import React from "react";
import * as S from '../styles/LoadingStyled';

const Spinner = '/Spinner.gif';

const Loading = () => {
  return (
    <S.LoadingContainer>
      <S.LoadingContent>
        <h2>시간표를 생성 중입니다.</h2>
        <img src={Spinner} alt="loading" width="30%" />
      </S.LoadingContent>
    </S.LoadingContainer>
  );
};

export default Loading;