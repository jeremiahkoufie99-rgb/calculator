// --- Core Calculator State Variables ---

// displayValue stores the current character string shown on the calculator's primary screen
let displayValue = '0';

// firstOperand stores the numerical value of the first number entered prior to selecting an operator
let firstOperand = null;

// operator holds the current active mathematical operation symbol (e.g. '+', '-', '*', '/', '^', 'mod')
let operator = null;

// waitingForSecondOperand is a flag that triggers whether typing a new number should replace or append to the screen
let waitingForSecondOperand = false;

// historyString builds the linear formula text shown on the secondary top line of the display (e.g., '12 + 3 =')
let historyString = '';

// angleMode tracks the mathematical angle mode ('DEG' for degrees, 'RAD' for radians) used by trigonometric functions
let angleMode = 'DEG';

// parenthesisStack is a LIFO (Last-In-First-Out) array used to store accumulator contexts when nesting brackets '('
const parenthesisStack = [];


// --- DOM Element References ---

// mainDisplay refers to the large text element where the active operand or result is rendered
const mainDisplay = document.getElementById('main-display');

// historyDisplay refers to the smaller top-level history string element showing previous expressions
const historyDisplay = document.getElementById('history-display');

// buttons refers to a collection of all HTML button tags present on the page
const buttons = document.querySelectorAll('button');

// btnStandard reference is the button element used to switch the calculator to standard layout mode
const btnStandard = document.getElementById('mode-standard');

// btnScientific reference is the button element used to switch the calculator to scientific layout mode
const btnScientific = document.getElementById('mode-scientific');

// calcCard reference is the main outer card container of the calculator used to change its width
const calcCard = document.getElementById('calculator-card');

// scientificPanel reference is the grid container of scientific buttons toggled standard vs scientific
const scientificPanel = document.getElementById('scientific-panel');

// angleIndicator reference is the glowing DEG/RAD tag displayed on the top left of the display box
const angleIndicator = document.getElementById('angle-indicator');

// btnAngleToggle reference is the scientific panel button that swaps Degree and Radian modes
const btnAngleToggle = document.getElementById('btn-angle-toggle');


// --- Mode Toggle Events ---

// Add listener to Standard button to toggle layout to simple mode when clicked
btnStandard.addEventListener('click', () => setMode('standard'));

// Add listener to Scientific button to toggle layout to scientific mode when clicked
btnScientific.addEventListener('click', () => setMode('scientific'));

// setMode alters the layout, class names, transitions, and widths based on chosen mode ('standard' or 'scientific')
function setMode(mode) {
    // If scientific mode is chosen, expand the card horizontally and show the side scientific panel
    if (mode === 'scientific') {
        // Apply highlighted purple styling classes to Scientific toggle, making it look active
        btnScientific.className = "px-4 py-1 text-xs font-semibold rounded-full cursor-pointer transition-all duration-250 bg-gradient-to-br from-indigo-500 to-purple-650 text-white shadow-[0_2px_8px_rgba(99,102,241,0.2)]";
        // Remove active styling from Standard toggle button, making it look inactive
        btnStandard.className = "px-4 py-1 text-xs font-semibold rounded-full cursor-pointer transition-all duration-250 text-slate-400 hover:text-slate-800";
        
        // Remove standard small width class limits
        calcCard.classList.remove('max-w-sm');
        // Add wider class limits to accommodate the left-side scientific key grid side-by-side
        calcCard.classList.add('max-w-3xl');
        
        // Remove hidden utility to make the scientific buttons grid structure active
        scientificPanel.classList.remove('hidden');
        // Re-apply standard layout grid representation
        scientificPanel.classList.add('grid');
        
        // Schedule a small delay to trigger smooth opacity fade-in and scaling expansion transitions
        setTimeout(() => {
            // Remove hidden initial classes
            scientificPanel.classList.remove('opacity-0', 'scale-95');
            // Add visible final layout classes
            scientificPanel.classList.add('opacity-100', 'scale-100');
        }, 50);

        // Remove hidden class from angle mode label so DEG/RAD pill is visible
        angleIndicator.classList.remove('hidden');
    } else {
        // Apply highlighted active styling back to the Standard toggle button
        btnStandard.className = "px-4 py-1 text-xs font-semibold rounded-full cursor-pointer transition-all duration-250 bg-gradient-to-br from-indigo-500 to-purple-650 text-white shadow-[0_2px_8px_rgba(99,102,241,0.2)]";
        // Reset scientific toggle button to grayed-out inactive styles
        btnScientific.className = "px-4 py-1 text-xs font-semibold rounded-full cursor-pointer transition-all duration-250 text-slate-400 hover:text-slate-800";
        
        // Start collapsing panel transitions by fading it out and shrinking it down
        scientificPanel.classList.remove('opacity-100', 'scale-100');
        scientificPanel.classList.add('opacity-0', 'scale-95');
        
        // Wait for fading animation (200 milliseconds) to finish before fully removing panel from DOM layout flow
        setTimeout(() => {
            // Remove grid utility
            scientificPanel.classList.remove('grid');
            // Hide scientific panel grid completely
            scientificPanel.classList.add('hidden');
            // Remove widescreen width constraint limits
            calcCard.classList.remove('max-w-3xl');
            // Re-apply standard small size constraints
            calcCard.classList.add('max-w-sm');
        }, 200);

        // Hide angle indicator pill from display
        angleIndicator.classList.add('hidden');
    }
}


// --- Button Mapping & Event Registration ---

// Bind normal click event listeners to standard numerical and standard operation buttons
buttons.forEach(button => {
    // Exclude mode toggles, angle swaps, and specific scientific keys to prevent listener collision
    if (button.id !== 'mode-standard' && button.id !== 'mode-scientific' && button.id !== 'btn-angle-toggle' && !button.hasAttribute('data-scientific')) {
        // Whenever a standard button is clicked, execute our dispatcher handler
        button.addEventListener('click', () => {
            handleButtonClick(button);
        });
    }
});

// Bind event listeners exclusively to scientific functions present in the left panel grid
const scientificButtons = document.querySelectorAll('button[data-scientific]');
// Loop over each scientific button reference in the node list
scientificButtons.forEach(button => {
    // Whenever a scientific key is clicked, trigger corresponding computational engine methods
    button.addEventListener('click', () => {
        // Trigger quick physical scale and lighting visual animation feedback
        animateButton(button);
        // Get the string mapping name of the clicked scientific button
        const func = button.getAttribute('data-scientific');
        // Check if parenthesis open button was pressed
        if (func === '(') {
            // Push active calculator context onto the nesting stack
            handleParenthesisOpen();
        } else if (func === ')') {
            // Collapse parentheses and calculate inside brackets expression
            handleParenthesisClose();
        } else {
            // Resolve basic unary operations immediately (e.g. sin, cos, logs, roots, exponents)
            handleScientificUnary(func);
        }
        // Update display with fresh changes
        updateDisplay();
    });
});

// Bind custom logic toggle event listener to Angle Mode Rad/Deg swap button
btnAngleToggle.addEventListener('click', () => {
    // Scale and flash active button visuals
    animateButton(btnAngleToggle);
    // Alternate angleMode flag value between DEG and RAD
    angleMode = angleMode === 'DEG' ? 'RAD' : 'DEG';
    // Update display indicator label to active mode string
    angleIndicator.textContent = angleMode;
    // Set appropriate styling color themes for Radian (indigo) vs Degree (emerald) mode
    if (angleMode === 'RAD') {
        angleIndicator.className = "absolute top-4 left-4 px-2 py-0.5 text-[9px] font-bold tracking-widest text-indigo-500 bg-indigo-50 rounded border border-indigo-200 shadow-sm";
    } else {
        angleIndicator.className = "absolute top-4 left-4 px-2 py-0.5 text-[9px] font-bold tracking-widest text-emerald-600 bg-emerald-50 rounded border border-emerald-200 shadow-sm";
    }
});

// Register global window keydown listener to map desktop keyboard entries to calculator methods
window.addEventListener('keydown', handleKeyboardInput);


// --- Logical Dispatch Handlers ---

// handleButtonClick categorizes and dispatches numbers, actions, or operators based on key attributes
function handleButtonClick(button) {
    // Perform press scale animation
    animateButton(button);

    // Read attributes to identify button type
    const number = button.getAttribute('data-number');
    const op = button.getAttribute('data-operator');
    const action = button.getAttribute('data-action');

    // Route inputs to respective calculator functions
    if (number !== null) {
        inputDigit(number);
    } else if (op !== null) {
        inputOperator(op);
    } else if (action !== null) {
        handleAction(action);
    }

    // Refresh UI display contents
    updateDisplay();
}

// handleKeyboardInput maps keyboard triggers to virtual key presses, matching exact actions
function handleKeyboardInput(e) {
    // Read the character value of physical key pressed
    let key = e.key;
    // Reference pointer for mapping visual feedback flashes to the corresponding virtual key
    let targetButton = null;

    // Check if key is a digit between 0 and 9
    if (key >= '0' && key <= '9') {
        // Query selector matches standard key matching digit
        targetButton = document.querySelector(`button[data-number="${key}"]`);
        // Trigger digit processing method
        if (targetButton) inputDigit(key);
    } else if (key === '.') {
        // Query selector matches standard decimal key
        targetButton = document.querySelector(`button[data-action="decimal"]`);
        // Append dot representation
        if (targetButton) inputDecimal();
    } else if (key === '+' || key === '-' || key === '*' || key === '/' || key === '^' || key === '%') {
        // Map modulo remainder action in scientific panel if percent key is pressed
        let mappedOp = key;
        if (key === '%') mappedOp = 'mod';
        // Retrieve operator button element
        targetButton = document.querySelector(`button[data-operator="${mappedOp}"]`);
        // If modulo button doesn't exist (because Standard mode is active), fallback to normal percentage calculation
        if (!targetButton && key === '%') {
            targetButton = document.querySelector(`button[data-action="percent"]`);
            if (targetButton) handleAction('percent');
        } else if (targetButton) {
            // Append binary operator logic
            inputOperator(mappedOp);
        }
    } else if (key === '(' || key === ')') {
        // Locate matching bracket selector button
        targetButton = document.querySelector(`button[data-scientific="${key}"]`);
        if (targetButton) {
            // Route to appropriate parenthesis method
            if (key === '(') handleParenthesisOpen();
            else handleParenthesisClose();
        }
    } else if (key === 'Enter' || key === '=') {
        // Retrieve standard equals selector button
        targetButton = document.querySelector(`button[data-action="equals"]`);
        // Trigger expression resolution method
        if (targetButton) handleAction('equals');
    } else if (key === 'Escape' || key === 'c' || key === 'C') {
        // Map Escape or C keys to the clear standard actions
        targetButton = document.querySelector(`button[data-action="clear"]`);
        // Execute reset engine values
        if (targetButton) handleAction('clear');
    } else if (key === 'Backspace') {
        // Handle physical deletion action
        handleBackspace();
    } else if (key === 'p' || key === 'P') {
        // Map P key to Pi math constants
        targetButton = document.querySelector(`button[data-scientific="pi"]`);
        if (targetButton) handleScientificUnary('pi');
    } else if (key === 'e' || key === 'E') {
        // Map E key to Euler constant
        targetButton = document.querySelector(`button[data-scientific="e"]`);
        if (targetButton) handleScientificUnary('e');
    }

    // If key has a valid corresponding UI button on screen, trigger click scaling feedback and update screen
    if (targetButton) {
        animateButton(targetButton);
        updateDisplay();
    }
}

// animateButton adds a momentary transition scale-down class to mimic physical clicking
function animateButton(button) {
    // Add active animation class
    button.classList.add('btn-active-animation');
    // Remove class after 80 milliseconds to reset visual button style
    setTimeout(() => {
        button.classList.remove('btn-active-animation');
    }, 80);
}


// --- Standard Calculator Logic Methods ---

// inputDigit processes typed numeric entries (0-9)
function inputDigit(digit) {
    // If waiting for second operand, clear current display and start typing fresh digit
    if (waitingForSecondOperand) {
        displayValue = digit;
        waitingForSecondOperand = false;
    } else {
        // Append digit or overwrite initial '0' string value to prevent expressions like '05'
        displayValue = displayValue === '0' ? digit : displayValue + digit;
    }
    // Remove any active operator highlight colors
    clearOperatorHighlights();
}

// inputDecimal appends floating-point decimals to display string
function inputDecimal() {
    // If operator was just selected, decimals should start clean as '0.'
    if (waitingForSecondOperand) {
        displayValue = '0.';
        waitingForSecondOperand = false;
        clearOperatorHighlights();
        return;
    }

    // Allow only one decimal point in a single number sequence
    if (!displayValue.includes('.')) {
        displayValue += '.';
    }
}

// inputOperator processes binary operators (+, -, *, /, ^, mod)
function inputOperator(nextOperator) {
    // Convert current displayValue to a floating number representation
    const inputValue = parseFloat(displayValue);

    // If operator is already waiting and user changes their mind, overwrite operator symbol
    if (operator && waitingForSecondOperand) {
        operator = nextOperator;
        highlightOperator(nextOperator);
        updateHistory(nextOperator);
        return;
    }

    // If firstOperand is null, save active numerical value as first operand
    if (firstOperand === null && !isNaN(inputValue)) {
        firstOperand = inputValue;
    } else if (operator) {
        // Solve previous operation first (chained calculations like 5 + 3 - 2)
        const result = performCalculation(firstOperand, inputValue, operator);
        
        // Handle calculation errors gracefully (e.g. division by zero)
        if (result === 'Error') {
            triggerResetError();
            return;
        }
        
        // Display intermediate result on screen and save it as first operand
        displayValue = String(result);
        firstOperand = result;
    }

    // Set flag waiting for the next operand digits
    waitingForSecondOperand = true;
    // Set pending operator symbol
    operator = nextOperator;
    // Set active glowing ring feedback highlight on operator key
    highlightOperator(nextOperator);
    // Update history top string
    updateHistory(nextOperator);
}

// handleAction executes clearing, negations, decimals, and final calculations
function handleAction(action) {
    // Clear all registers and variables back to default initial values
    if (action === 'clear') {
        displayValue = '0';
        firstOperand = null;
        operator = null;
        waitingForSecondOperand = false;
        historyString = '';
        parenthesisStack.length = 0;
        clearOperatorHighlights();
    } else if (action === 'negate') {
        // Toggle sign of displayed value (positive vs negative)
        if (displayValue !== '0' && displayValue !== 'Error') {
            displayValue = String(parseFloat(displayValue) * -1);
        }
    } else if (action === 'percent') {
        // Divide display value by 100
        if (displayValue !== 'Error') {
            displayValue = String(parseFloat(displayValue) / 100);
        }
    } else if (action === 'decimal') {
        // Call decimal insert method
        inputDecimal();
    } else if (action === 'equals') {
        // Parse current display value
        const inputValue = parseFloat(displayValue);

        // Auto-close any unclosed parenthesis brackets if equal key is pressed
        while (parenthesisStack.length > 0) {
            handleParenthesisClose();
        }

        // If basic operation conditions are met, execute calculation
        if (operator && firstOperand !== null && !waitingForSecondOperand) {
            const result = performCalculation(firstOperand, inputValue, operator);
            
            // Render error if computation fails
            if (result === 'Error') {
                displayValue = 'Error';
            } else {
                // Update history string showing completed expression
                historyString = `${formatDisplayNumber(String(firstOperand))} ${getOperatorSymbol(operator)} ${formatDisplayNumber(displayValue)} =`;
                // Display final result string
                displayValue = String(result);
            }
            
            // Reset core operators to enable fresh calculations
            firstOperand = null;
            operator = null;
            waitingForSecondOperand = true;
            clearOperatorHighlights();
        }
    }
}

// handleBackspace implements step-wise character deletion
function handleBackspace() {
    // Do not delete characters if display represents an error or operator state
    if (waitingForSecondOperand || displayValue === 'Error' || displayValue === 'Infinity') {
        return;
    }
    // Delete last character from number sequence
    if (displayValue.length > 1) {
        displayValue = displayValue.slice(0, -1);
        // Reset display to zero if only lone negative sign remains
        if (displayValue === '-' || displayValue === '-0') {
            displayValue = '0';
        }
    } else {
        // Reset back to zero if length of string reduces to 0
        displayValue = '0';
    }
}


// --- Parentheses Nested Evaluation Logic (LIFO Stack) ---

// handleParenthesisOpen pushes standard engine state onto stack to resolve brackets
function handleParenthesisOpen() {
    // Parse current screen value
    const inputValue = parseFloat(displayValue);
    
    // Implicit multiplication logic: if typing digit followed by '(', assume multiply (e.g. 5( -> 5 * ()
    let op = operator;
    let first = firstOperand;
    if (!waitingForSecondOperand && displayValue !== '0' && operator === null) {
        op = '*';
        first = inputValue;
    }

    // Push local computation frames onto bracket storage array
    parenthesisStack.push({
        firstOperand: first,
        operator: op,
        historyPrefix: historyString
    });

    // Reset standard accumulator context to allow independent calculations inside brackets
    firstOperand = null;
    operator = null;
    waitingForSecondOperand = false;

    // Construct visual display representation
    if (op !== null) {
        historyString = `${historyString ? historyString : formatDisplayNumber(String(first))} ${getOperatorSymbol(op)} (`;
    } else {
        historyString = historyString ? `${historyString} (` : '(';
    }

    // Reset screen value to start typing fresh nested inputs
    displayValue = '0';
    clearOperatorHighlights();
}

// handleParenthesisClose pops stack context frames, computing nested values
function handleParenthesisClose() {
    // Do not trigger if stack has no opened parentheses
    if (parenthesisStack.length === 0) return;

    // Read current display value
    let localVal = parseFloat(displayValue);
    if (isNaN(localVal)) localVal = 0;

    // Resolve intermediate computations inside active brackets first
    if (operator && firstOperand !== null && !waitingForSecondOperand) {
        const res = performCalculation(firstOperand, localVal, operator);
        if (res === 'Error') {
            triggerResetError();
            return;
        }
        localVal = res;
    }

    // Pop bracket context frame from the stack array
    const context = parenthesisStack.pop();

    // Update history trace representation
    historyString = `${historyString} ${formatDisplayNumber(String(localVal))} )`;

    // Calculate nested results alongside parent operands
    if (context.operator !== null && context.firstOperand !== null) {
        const finalResult = performCalculation(context.firstOperand, localVal, context.operator);
        if (finalResult === 'Error') {
            triggerResetError();
            return;
        }
        displayValue = String(finalResult);
        firstOperand = finalResult;
    } else {
        // Set accumulated local expression value directly
        displayValue = String(localVal);
        firstOperand = localVal;
    }

    // Reset operator state
    operator = null;
    waitingForSecondOperand = true;
    clearOperatorHighlights();
}


// --- Scientific Unary Calculation Engine ---

// handleScientificUnary processes instant functional transformations (sin, cos, logs, roots, exponents, constants)
function handleScientificUnary(func) {
    // Convert current displayValue to a floating number representation
    const val = parseFloat(displayValue);
    if (isNaN(val)) return;

    // Initialize temporary result variable
    let res = 0;
    // Switch on string identifier matching scientific operations
    switch (func) {
        case 'sin':
            // Convert degrees to radians if angleMode is set to DEG
            res = angleMode === 'DEG' ? Math.sin(val * Math.PI / 180) : Math.sin(val);
            // Eliminate tiny float precision remains (e.g. sin(180) should be 0, not 1.22e-16)
            if (Math.abs(res) < 1e-15) res = 0;
            break;
        case 'cos':
            // Convert degrees to radians if angleMode is set to DEG
            res = angleMode === 'DEG' ? Math.cos(val * Math.PI / 180) : Math.cos(val);
            // Eliminate tiny float precision remains
            if (Math.abs(res) < 1e-15) res = 0;
            break;
        case 'tan':
            // Convert degrees to radians if angleMode is set to DEG
            res = angleMode === 'DEG' ? Math.tan(val * Math.PI / 180) : Math.tan(val);
            // Eliminate tiny float precision remains
            if (Math.abs(res) < 1e-15) res = 0;
            break;
        case 'asin':
            // Enforce domain constraints for inverse trigs (-1 to 1)
            if (val < -1 || val > 1) { triggerResetError(); return; }
            res = Math.asin(val);
            // Convert Radian output to Degree metric if angleMode is set to DEG
            if (angleMode === 'DEG') res = res * 180 / Math.PI;
            break;
        case 'acos':
            // Enforce domain constraints
            if (val < -1 || val > 1) { triggerResetError(); return; }
            res = Math.acos(val);
            // Convert Radian output to Degree metric if angleMode is set to DEG
            if (angleMode === 'DEG') res = res * 180 / Math.PI;
            break;
        case 'atan':
            res = Math.atan(val);
            // Convert Radian output to Degree metric if angleMode is set to DEG
            if (angleMode === 'DEG') res = res * 180 / Math.PI;
            break;
        case 'sqr':
            // Raise number to second power
            res = Math.pow(val, 2);
            break;
        case 'cube':
            // Raise number to third power
            res = Math.pow(val, 3);
            break;
        case 'recip':
            // Enforce division by zero checks
            if (val === 0) { triggerResetError(); return; }
            // Reciprocal formula
            res = 1 / val;
            break;
        case 'sqrt':
            // Enforce domain bounds (no negative values)
            if (val < 0) { triggerResetError(); return; }
            res = Math.sqrt(val);
            break;
        case 'ln':
            // Enforce natural log bounds (strictly greater than zero)
            if (val <= 0) { triggerResetError(); return; }
            res = Math.log(val);
            break;
        case 'log':
            // Enforce log base 10 bounds
            if (val <= 0) { triggerResetError(); return; }
            res = Math.log10(val);
            break;
        case 'pi':
            // Immediately overwrite active screen buffer with Pi value
            displayValue = String(Math.PI);
            waitingForSecondOperand = false;
            return;
        case 'e':
            // Immediately overwrite active screen buffer with Euler constant value
            displayValue = String(Math.E);
            waitingForSecondOperand = false;
            return;
        case 'tenPower':
            // 10 to power of display value
            res = Math.pow(10, val);
            break;
        case 'ePower':
            // Euler constant to power of display value
            res = Math.exp(val);
            break;
        case 'abs':
            // Retrieve absolute magnitude value
            res = Math.abs(val);
            break;
        case 'fact':
            // Call factorial helper
            const factRes = factorial(val);
            // Re-route calculation error cases
            if (factRes === 'Error') {
                triggerResetError();
                return;
            }
            displayValue = String(factRes);
            waitingForSecondOperand = false;
            return;
        case 'rand':
            // Return random float representation
            displayValue = String(Math.random());
            waitingForSecondOperand = false;
            return;
        default:
            return;
    }

    // Check computational overflow boundary limits
    if (isNaN(res) || !isFinite(res)) {
        triggerResetError();
    } else {
        // Enforce float safety to 12 degrees of precision
        displayValue = String(parseFloat(res.toPrecision(12)));
        waitingForSecondOperand = false;
    }
}

// factorial calculates integer factorials recursively
function factorial(n) {
    // Exclude negative inputs and fractional numbers
    if (n < 0 || !Number.isInteger(n)) return 'Error';
    // Max double precision boundary limit checker
    if (n > 170) return 'Infinity'; 
    let res = 1;
    // Multiply iteratively
    for (let i = 2; i <= n; i++) res *= i;
    return res;
}

// triggerResetError formats calculator states back to safe clear default values on computational faults
function triggerResetError() {
    displayValue = 'Error';
    firstOperand = null;
    operator = null;
    waitingForSecondOperand = false;
    historyString = '';
    parenthesisStack.length = 0;
    clearOperatorHighlights();
}


// --- Mathematical Computation Engine ---

// performCalculation performs general binary calculations (+, -, *, /, ^, mod)
function performCalculation(first, second, op) {
    let result = 0;
    // Switch on active operation character
    switch (op) {
        case '+':
            result = first + second;
            break;
        case '-':
            result = first - second;
            break;
        case '*':
            result = first * second;
            break;
        case '/':
            // Stop divide by zero cases
            if (second === 0) {
                return 'Error';
            }
            result = first / second;
            break;
        case '^':
            // Exponents powers calculations
            result = Math.pow(first, second);
            break;
        case 'mod':
            // Remainder calculations
            result = first % second;
            break;
        default:
            return second;
    }

    // Safely round arithmetic precision to eliminate binary float limitations (e.g. 0.1 + 0.2 = 0.3)
    return parseFloat(result.toPrecision(12));
}


// --- Visual and Text Formatting Helpers ---

// updateHistory syncs history values showing previous expressions
function updateHistory(op) {
    const formatted = formatDisplayNumber(String(firstOperand));
    const symbol = getOperatorSymbol(op);
    historyString = `${formatted} ${symbol}`;
}

// getOperatorSymbol maps binary characters to visual display strings
function getOperatorSymbol(op) {
    switch (op) {
        case '/': return '÷';
        case '*': return '×';
        case '-': return '−';
        case '+': return '+';
        case '^': return '^';
        case 'mod': return 'mod';
        default: return '';
    }
}

// highlightOperator adds glowing class to active operation key on screen
function highlightOperator(op) {
    clearOperatorHighlights();
    const operatorButton = document.querySelector(`button[data-operator="${op}"]`);
    if (operatorButton) {
        operatorButton.classList.add('operator-active');
    }
}

// clearOperatorHighlights removes glowing class from all buttons
function clearOperatorHighlights() {
    buttons.forEach(button => {
        button.classList.remove('operator-active');
    });
}

// updateDisplay syncs main text blocks with fresh state and scales fonts dynamically
function updateDisplay() {
    // Format display string with comma layouts and update content
    mainDisplay.textContent = formatDisplayNumber(displayValue);
    historyDisplay.textContent = historyString;

    // Check display character count length
    const length = mainDisplay.textContent.length;
    // Shrink text sizes progressively as length grows to prevent text clipping
    if (length > 15) {
        mainDisplay.className = "text-slate-800 text-2xl font-light tracking-tight truncate w-full text-right transition-all duration-100 select-all";
    } else if (length > 11) {
        mainDisplay.className = "text-slate-800 text-3xl font-light tracking-tight truncate w-full text-right transition-all duration-100 select-all";
    } else if (length > 8) {
        mainDisplay.className = "text-slate-800 text-4xl font-light tracking-tight truncate w-full text-right transition-all duration-100 select-all";
    } else {
        mainDisplay.className = "text-slate-800 text-5xl font-light tracking-tight truncate w-full text-right transition-all duration-100 select-all";
    }
}

// formatDisplayNumber formats display digits with correct decimal formatting and comma divisions
function formatDisplayNumber(numStr) {
    // Preserve string literals directly
    if (numStr === 'Error' || numStr === 'Infinity' || numStr === '-Infinity') {
        return numStr;
    }
    // Return base zero string if parameter is empty
    if (!numStr) return '0';

    // Separate decimals from integer digits
    const parts = numStr.split('.');
    let integerPart = parts[0];
    const hasDecimal = numStr.includes('.');
    const decimalPart = parts[1];

    // Format integer segment with standard local commas (e.g. 1,000,000)
    const num = parseFloat(integerPart);
    if (!isNaN(num)) {
        if (integerPart === '-0') {
            integerPart = '-0';
        } else if (integerPart === '-') {
            integerPart = '-';
        } else {
            // Apply commas format
            integerPart = num.toLocaleString('en-US', { maximumFractionDigits: 0 });
        }
    }

    // Reconstruct decimal values cleanly
    if (hasDecimal) {
        return integerPart + '.' + (decimalPart !== undefined ? decimalPart : '');
    }
    // Return formatted integer values
    return integerPart;
}

// --- Initialize Display values on first page load ---
updateDisplay();
