import React, { useState, useEffect } from 'react';
import * as S from '../styles/WorkCount';

const TableRow = ({ data = [] }) => {
    const [RowData, setRowData] = useState(data);

    useEffect(() => {
        setRowData(data || []);
    }, [data]);

    return (
        <S.Table>
            <thead>
                <tr>
                    <th></th>
                    {RowData.map((_, index) => (
                        <th key={index}>직원 {index + 1}</th> // 열 헤더
                    ))}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th>이름</th> {/* 행 헤더 */}
                    {RowData.map((row, index) => (
                        <td key={`name-${index}`}>{row.name}</td>
                    ))}
                </tr>
                <tr>
                    <th>출근 횟수</th> {/* 행 헤더 */}
                    {RowData.map((row, index) => (
                        <td key={`attendance-${index}`}>{row.attendanceCount}</td>
                    ))}
                </tr>
            </tbody>
        </S.Table>
    );
};

export default TableRow;
