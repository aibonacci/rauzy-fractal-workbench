import { Translations } from '../types';

export const en: Translations = {
    app: {
        title: "Rauzy Fractal Workbench",
        loading: "Loading..."
    },
    controls: {
        pathInput: {
            label: "Build Path (e.g., 1213)",
            placeholder: "Enter path, e.g., 1213 or 1,2,1,3",
            addButton: "Add Path to List"
        },
        pathList: {
            title: "Path List",
            empty: "No paths added yet. Add a path above to start analysis.",
            deleteTooltip: "Delete path",
            totalPaths: "Total paths: {count}",
            colorIndicator: "Path color indicator",
            pathInfo: "Path: {path}, Weight: {weight}"
        },
        pointsSlider: {
            label: "Number of Points",
            unit: "points",
            dragging: "Dragging: {value} points"
        }
    },
    dataPanel: {
        title: "Analysis Data",
        noData: "No analysis data available",
        addPathHint: "Add paths to see analysis results",
        supportedFormats: "Supported formats:",
        totalAnalyzed: "Total analyzed: {count} paths",
        expand: "Expand data panel",
        collapse: "Collapse data panel",
        formatExamples: {
            sequence: "Number sequence: 123, 132, 213",
            comma: "Comma separated: 1,2,3 or 1, 2, 3"
        },
        maxPaths: "Maximum 300 paths supported",
        pathCard: {
            pathTitle: "Path ({path})",
            colorIndicator: "Path color indicator",
            rValue: "r value:",
            cValue: "C value:",
            coefficients: "Coefficients:",
            firstPointCoords: "First point coordinates:",
            positionSequence: "Position sequence ({count} items):"
        }
    },
    canvas: {
        totalPoints: "Total Points: {count}",
        renderedPoints: "Rendered: {count}",
        renderTime: "Render Time: {time}ms"
    },
    notifications: {
        calculationComplete: "Calculation completed successfully",
        calculationFailed: "Calculation failed. Please try again.",
        pathAdded: "Path added to analysis list",
        calculationCanceled: "Calculation was canceled",
        mathJsLoadFailed: "Math.js library failed to load",
        startingCalculation: "Starting calculation...",
        calculating: "Calculating...",
        baseDataCalculationFailed: "Base data calculation failed",
        baseDataCalculationError: "Error calculating base data, please try again",
        pathInvalid: "Path is invalid",
        pathParsingFailed: "Path parsing failed",
        pathAlreadyExists: "This path already exists",
        baseDataNotReady: "Base data not ready, please wait",
        pathDataCalculationError: "Error calculating path data",
        pointsGenerated: "Generated {count} fractal points",
        maxPathsReached: "Maximum {maxPaths} paths allowed",
        pathAddedSuccess: "Path ({path}) successfully added to analysis list"
    },
    links: {
        liuTheorem: "Liu's Theorem",
        github: "GitHub Repository",
        liuTheoremTooltip: "Learn about Liu's Theorem (opens in new tab)",
        githubTooltip: "View source code on GitHub (opens in new tab)"
    },
    common: {
        delete: "Delete",
        cancel: "Cancel",
        confirm: "Confirm",
        loading: "Loading",
        switchLanguage: "Switch language",
        currentLanguage: "Current language: {lang}"
    }
};