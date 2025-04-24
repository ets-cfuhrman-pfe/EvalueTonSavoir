import React, { useState } from "react";
import { TableCell, TableHead, TableRow } from "@mui/material";

interface LiveResultsHeaderProps {
    maxQuestions: number;
    showSelectedQuestion: (index: number) => void;
}

const LiveResultsTableHeader: React.FC<LiveResultsHeaderProps> = ({
    maxQuestions,
    showSelectedQuestion,
}) => {
    const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);

    const handleQuestionClick = (index: number) => {
        setSelectedQuestionIndex(index);
        showSelectedQuestion(index);
    };

    return (
        <TableHead>
            <TableRow>
                <TableCell className="sticky-column">
                    <div className="text-base text-bold">Nom d&apos;utilisateur</div>
                </TableCell>
                {Array.from({ length: maxQuestions }, (_, index) => (
                    <TableCell
                        key={index}
                        sx={{
                            textAlign: 'center',
                            cursor: 'pointer',
                            borderStyle: 'solid',
                            borderWidth: 1,
                            borderColor: 'rgba(224, 224, 224, 1)',
                            backgroundColor: selectedQuestionIndex === index ? '#dedede' : 'transparent'
                        }}
                        onClick={() => handleQuestionClick(index)}
                    >
                        <div className="text-base text-bold blue">{`Q${index + 1}`}</div>
                    </TableCell>
                ))}
                <TableCell
                    className="sticky-header"
                    sx={{
                        textAlign: 'center',
                        borderStyle: 'solid',
                        borderWidth: 1,
                        borderColor: 'rgba(224, 224, 224, 1)'
                    }}
                >
                    <div className="text-base text-bold">% réussite</div>
                </TableCell>
            </TableRow>
        </TableHead>
    );
};
export default LiveResultsTableHeader;
