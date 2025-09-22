import React from "react";
import { TableCell, TableHead, TableRow } from "@mui/material";

interface LiveResultsHeaderProps {
    maxQuestions: number;
    showSelectedQuestion: (index: number) => void;
    selectedQuestionIndex?: number;
}

const LiveResultsTableHeaderV2: React.FC<LiveResultsHeaderProps> = ({
    maxQuestions,
    showSelectedQuestion,
    selectedQuestionIndex
}) => {
    const handleQuestionClick = (index: number) => {
        if (selectedQuestionIndex === index) {
            // Clicking the same question - close it
            showSelectedQuestion(-1);
        } else {
            // Clicking a different question - select it
            showSelectedQuestion(index);
        }
    };

    return (
        <TableHead className="table-light">
            <TableRow>
                <TableCell className="sticky-column bg-white fw-semibold text-primary">
                    Nom d&apos;utilisateur
                </TableCell>
                {Array.from({ length: maxQuestions }, (_, index) => (
                    <TableCell
                        key={index}
                        className={`text-center fw-semibold text-primary question-cell ${
                            selectedQuestionIndex === index ? 'selected' : ''
                        }`}
                        onClick={() => handleQuestionClick(index)}
                    >
                        Q{index + 1}
                    </TableCell>
                ))}
                <TableCell
                    className="sticky-header text-center bg-white fw-semibold text-primary"
                >
                    % réussite
                </TableCell>
            </TableRow>
        </TableHead>
    );
};

export default LiveResultsTableHeaderV2;