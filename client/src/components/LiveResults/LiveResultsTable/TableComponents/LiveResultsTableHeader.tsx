import { TableCell, TableHead, TableRow } from "@mui/material";
import React from "react";

interface LiveResultsFooterProps {
    maxQuestions: number;
    showSelectedQuestion: (index: number) => void;
}

const LiveResultsTableFooter: React.FC<LiveResultsFooterProps> = ({
    maxQuestions,
    showSelectedQuestion,
}) => {

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
                            borderColor: 'rgba(224, 224, 224, 1)'
                        }}
                        onClick={() => showSelectedQuestion(index)}
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
export default LiveResultsTableFooter;