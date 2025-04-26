// DOM 元素
const modeSelect = document.getElementById('mode-select');
const mode1dConfig = document.getElementById('mode-1d-config');
const mode2dConfig = document.getElementById('mode-2d-config');
const arrowControls1d = document.getElementById('arrow-controls-1d');
const arrowControls2d = document.getElementById('arrow-controls-2d');
const cardsContainer = document.getElementById('cards-container');
const cardsContainer2d = document.getElementById('cards-container-2d');

// 一维模式元素
const arraySizeInput = document.getElementById('array-size');
const cardSizeInput = document.getElementById('card-size');
const generateBtn1d = document.getElementById('generate-btn-1d');
const resetBtn1d = document.getElementById('reset-btn-1d');
const flipBtn1d = document.getElementById('flip-btn-1d');
const clearSelectionBtn1d = document.getElementById('clear-selection-btn-1d');
const leftArrow = document.getElementById('left-arrow');
const rightArrow = document.getElementById('right-arrow');

// 二维模式元素
const matrixRowsInput = document.getElementById('matrix-rows');
const matrixColsInput = document.getElementById('matrix-cols');
const cardSize2dInput = document.getElementById('card-size-2d');
const generateBtn2d = document.getElementById('generate-btn-2d');
const resetBtn2d = document.getElementById('reset-btn-2d');
const rotateBtn2d = document.getElementById('rotate-btn-2d');
const clearSelectionBtn2d = document.getElementById('clear-selection-btn-2d');
const leftArrow2d = document.getElementById('left-arrow-2d');
const rightArrow2d = document.getElementById('right-arrow-2d');
const upArrow = document.getElementById('up-arrow');
const downArrow = document.getElementById('down-arrow');

// 全局变量
let currentMode = '1d'; // 默认为一维模式
let cardsArray = []; // 存储原始数组
let displayArray = []; // 存储显示数组（包括翻转后的顺序）
let selectedIndices = []; // 存储选中的卡牌索引
let cardSize = 60; // 默认卡牌大小
let isSelecting = false; // 是否正在选择中
let selectionStartIndex = null; // 选择的起始索引

// 二维矩阵特有变量
let matrixRows = 5;
let matrixCols = 7;
let matrix = []; // 二维矩阵数据
let displayMatrix = []; // 显示用的二维矩阵（包括旋转后的状态）
let selectionStart = { row: null, col: null }; // 选择起始位置
let selectionEnd = { row: null, col: null }; // 选择结束位置

// 初始化
window.addEventListener('DOMContentLoaded', () => {
    // 模式切换事件
    modeSelect.addEventListener('change', switchMode);
    
    // 一维模式事件监听
    generateBtn1d.addEventListener('click', generateCards1d);
    resetBtn1d.addEventListener('click', resetAllCards1d);
    flipBtn1d.addEventListener('click', flipSelectedCards1d);
    clearSelectionBtn1d.addEventListener('click', clearSelection);
    cardSizeInput.addEventListener('input', updateCardSize);
    
    // 二维模式事件监听
    generateBtn2d.addEventListener('click', generateCards2d);
    resetBtn2d.addEventListener('click', resetAllCards2d);
    rotateBtn2d.addEventListener('click', rotateSelectedCards2d);
    clearSelectionBtn2d.addEventListener('click', clearSelection);
    cardSize2dInput.addEventListener('input', updateCardSize);
    
    // 箭头按钮事件监听
    leftArrow.addEventListener('click', () => moveArray1d('left'));
    rightArrow.addEventListener('click', () => moveArray1d('right'));
    leftArrow2d.addEventListener('click', () => moveMatrix2d('left'));
    rightArrow2d.addEventListener('click', () => moveMatrix2d('right'));
    upArrow.addEventListener('click', () => moveMatrix2d('up'));
    downArrow.addEventListener('click', () => moveMatrix2d('down'));
    
    // 初始生成卡牌（一维模式）
    generateCards1d();
});

// 切换模式
function switchMode() {
    currentMode = modeSelect.value;
    
    if (currentMode === '1d') {
        mode1dConfig.classList.remove('hidden');
        mode2dConfig.classList.add('hidden');
        arrowControls1d.classList.remove('hidden');
        arrowControls2d.classList.add('hidden');
        generateCards1d();
    } else {
        mode1dConfig.classList.add('hidden');
        mode2dConfig.classList.remove('hidden');
        arrowControls1d.classList.add('hidden');
        arrowControls2d.classList.remove('hidden');
        generateCards2d();
    }
    
    // 清除选择
    clearSelection();
}

// 更新卡牌大小
function updateCardSize() {
    if (currentMode === '1d') {
        cardSize = parseInt(cardSizeInput.value);
    } else {
        cardSize = parseInt(cardSize2dInput.value);
    }
    
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        card.style.width = `${cardSize}px`;
        
        // 根据模式设置不同的高度
        if (currentMode === '1d') {
            card.style.height = `${Math.floor(cardSize * 1.5)}px`;
        } else { // 二维模式使用更小的高宽比
            card.style.height = `${Math.floor(cardSize * 1.2)}px`; // 高度降低
        }
        
        // 调整数字大小
        const cardNumber = card.querySelector('.card-number');
        cardNumber.style.fontSize = `${Math.floor(cardSize / 2)}px`;
    });
}

// 更新一维模式下选中卡牌的显示
function updateSelectedCards() {
    // 清除所有卡牌的选中状态
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // 添加选中状态
    selectedIndices.forEach(index => {
        const card = document.querySelector(`.card[data-display-index="${index}"]`);
        if (card) {
            card.classList.add('selected');
        }
    });
}

// 处理动画效果的公共函数，减少代码冗余
function handleAnimation(direction, arrowElement, callback) {
    // 添加按钮动画
    if (arrowElement) {
        arrowElement.classList.add('pulse');
        setTimeout(() => arrowElement.classList.remove('pulse'), 200);
    }
    
    // 添加卡牌移动动画
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.classList.add(`move-${direction}`);
        setTimeout(() => card.classList.remove(`move-${direction}`), 500); // 与CSS动画时间匹配
    });
    
    // 等待动画接近完成后执行实际移动
    setTimeout(() => {
        if (callback && typeof callback === 'function') {
            callback();
        }
    }, 250); // 在动画过程中的恰当时间点执行移动
}

// =================== 一维数组模式 ===================

// 生成一维卡牌
function generateCards1d() {
    // 获取数组大小
    const size = parseInt(arraySizeInput.value);
    
    // 验证输入
    if (isNaN(size) || size < 1 || size > 19) {
        alert('请输入1到19之间的数字');
        return;
    }
    
    // 清空容器和选择状态
    cardsContainer.innerHTML = '';
    selectedIndices = [];
    
    // 生成数组
    cardsArray = Array.from({ length: size }, (_, i) => i + 1);
    // 初始化显示数组与原始数组相同
    displayArray = [...cardsArray.map(num => ({ value: num, flipped: false }))];
    
    // 渲染卡牌
    renderCards1d();
    
    // 显示操作按钮
    resetBtn1d.classList.remove('hidden');
    flipBtn1d.classList.remove('hidden');
    clearSelectionBtn1d.classList.remove('hidden');
}

// 渲染一维卡牌
function renderCards1d() {
    // 清空容器
    cardsContainer.innerHTML = '';
    
    // 创建卡牌元素
    displayArray.forEach((item, displayIndex) => {
        const card = document.createElement('div');
        card.className = item.flipped ? 'card flipped' : 'card normal';
        card.dataset.displayIndex = displayIndex;
        card.dataset.mode = '1d';
        
        // 设置卡牌大小
        card.style.width = `${cardSize}px`;
        card.style.height = `${Math.floor(cardSize * 1.5)}px`;
        
        const cardNumber = document.createElement('div');
        cardNumber.className = 'card-number';
        cardNumber.textContent = item.value;
        cardNumber.style.fontSize = `${Math.floor(cardSize / 2)}px`;
        
        card.appendChild(cardNumber);
        cardsContainer.appendChild(card);
        
        // 添加点击事件
        card.addEventListener('mousedown', handleCardMouseDown);
        card.addEventListener('mouseover', handleCardMouseOver);
        card.addEventListener('mouseup', handleCardMouseUp);
    });
    
    // 高亮选中的卡牌
    updateSelectedCards();
}

// 处理卡牌的鼠标按下事件
function handleCardMouseDown(e) {
    const mode = e.currentTarget.dataset.mode;
    
    if (mode === '1d') {
        isSelecting = true;
        selectionStartIndex = parseInt(e.currentTarget.dataset.displayIndex);
        
        // 清除当前选择
        clearSelection();
        
        // 添加当前卡牌到选择
        selectedIndices = [selectionStartIndex];
        updateSelectedCards();
        
        // 防止文本选择
        e.preventDefault();
    } else if (mode === '2d') {
        isSelecting = true;
        const row = parseInt(e.currentTarget.dataset.row);
        const col = parseInt(e.currentTarget.dataset.col);
        
        console.log("开始选择二维区域", row, col);
        
        if (isNaN(row) || isNaN(col)) {
            console.error('无效的行或列值', e.currentTarget.dataset);
            return;
        }
        
        // 设置选择起点
        selectionStart = { row, col };
        selectionEnd = { row, col };
        
        // 清除视觉上的选择状态，但不清除选择数据
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // 更新选择区域
        updateSelection2d();
        
        // 防止文本选择
        e.preventDefault();
    }
}

// 处理卡牌鼠标经过事件
function handleCardMouseOver(e) {
    if (!isSelecting) return;
    
    const mode = e.currentTarget.dataset.mode;
    
    if (mode === '1d') {
        const currentIndex = parseInt(e.currentTarget.dataset.displayIndex);
        
        // 确保选择的是连续的卡牌
        // 从起始点到当前经过的点之间的所有卡牌
        const start = Math.min(selectionStartIndex, currentIndex);
        const end = Math.max(selectionStartIndex, currentIndex);
        
        selectedIndices = [];
        for (let i = start; i <= end; i++) {
            selectedIndices.push(i);
        }
        
        updateSelectedCards();
    } else if (mode === '2d') {
        const row = parseInt(e.currentTarget.dataset.row);
        const col = parseInt(e.currentTarget.dataset.col);
        
        if (isNaN(row) || isNaN(col)) {
            console.error('无效的行或列值', e.currentTarget.dataset);
            return;
        }
        
        // 更新选择终点并记录
        selectionEnd = { row, col };
        console.log("选择区域更新为", selectionStart.row, selectionStart.col, "到", row, col);
        
        // 更新选择区域显示
        updateSelection2d();
    }
}

// 处理卡牌鼠标松开事件
function handleCardMouseUp() {
    isSelecting = false;
    // 记录完成选择
    console.log("Selection complete", currentMode === '2d' ? 
        `从(${selectionStart.row},${selectionStart.col})到(${selectionEnd.row},${selectionEnd.col})` : 
        `从${selectionStartIndex}到${selectedIndices[selectedIndices.length-1]}`);
}

// 水平翻转选中的卡牌（一维模式）
function flipSelectedCards1d() {
    // 如果没有选中卡牌，提示用户
    if (selectedIndices.length === 0) {
        alert('请先选择要翻转的卡牌');
        return;
    }
    
    // 对选中的卡牌进行排序（确保按显示索引顺序）
    const sortedIndices = [...selectedIndices].sort((a, b) => a - b);
    
    // 如果只选中了一张卡牌，只翻转内容不改变位置
    if (sortedIndices.length === 1) {
        const index = sortedIndices[0];
        displayArray[index].flipped = !displayArray[index].flipped;
    } else {
        // 提取选中的卡牌
        const selectedCards = sortedIndices.map(index => displayArray[index]);
        
        // 创建翻转后的卡牌（翻转顺序和内容）
        const flippedCards = selectedCards.map((card, i) => {
            // 反向索引
            const reverseIndex = selectedCards.length - 1 - i;
            return {
                value: selectedCards[reverseIndex].value,
                flipped: !selectedCards[reverseIndex].flipped
            };
        });
        
        // 替换原数组中的部分
        let j = 0;
        for (let i of sortedIndices) {
            displayArray[i] = flippedCards[j++];
        }
    }
    
    // 重新渲染卡牌
    renderCards1d();
    
    // 清除选择
    clearSelection();
    
    // 添加高亮动画效果
    sortedIndices.forEach(index => {
        const card = document.querySelector(`.card[data-display-index="${index}"]`);
        if (card) {
            card.classList.add('highlight');
            setTimeout(() => {
                card.classList.remove('highlight');
            }, 500);
        }
    });
}

// 重置所有卡牌（一维模式）
function resetAllCards1d() {
    // 重置为原始数组
    displayArray = cardsArray.map(num => ({ value: num, flipped: false }));
    
    // 重新渲染
    renderCards1d();
    
    // 清除选择
    clearSelection();
    
    // 添加高亮动画
    document.querySelectorAll('.card').forEach(card => {
        card.classList.add('highlight');
        setTimeout(() => {
            card.classList.remove('highlight');
        }, 500);
    });
}

// 一维数组循环移动
function moveArray1d(direction) {
    let arrowElement = direction === 'left' ? leftArrow : rightArrow;
    
    handleAnimation(direction, arrowElement, () => {
        if (direction === 'left') {
            // 向左移动：第一个元素移到末尾
            const firstItem = displayArray.shift();
            displayArray.push(firstItem);
        } else {
            // 向右移动：最后一个元素移到开头
            const lastItem = displayArray.pop();
            displayArray.unshift(lastItem);
        }
        
        // 重新渲染卡牌
        renderCards1d();
    });
}

// =================== 二维矩阵模式 ===================

// 生成二维卡牌
function generateCards2d() {
    // 获取矩阵大小
    matrixRows = parseInt(matrixRowsInput.value);
    matrixCols = parseInt(matrixColsInput.value);
    
    // 验证输入
    if (isNaN(matrixRows) || matrixRows < 1 || matrixRows > 10 ||
        isNaN(matrixCols) || matrixCols < 1 || matrixCols > 10) {
        alert('请输入有效的矩阵尺寸（行和列均为1-10之间）');
        return;
    }
    
    // 清空容器和选择状态
    cardsContainer2d.innerHTML = '';
    cardsContainer2d.className = 'cards-container mode-2d';
    cardsContainer2d.style.setProperty('--rows', matrixRows);
    cardsContainer2d.style.setProperty('--cols', matrixCols);
    selectedIndices = [];
    
    // 生成矩阵
    matrix = [];
    displayMatrix = [];
    let counter = 1;
    
    for (let i = 0; i < matrixRows; i++) {
        const row = [];
        const displayRow = [];
        
        for (let j = 0; j < matrixCols; j++) {
            row.push(counter);
            displayRow.push({ value: counter, flipped: false });
            counter++;
        }
        
        matrix.push(row);
        displayMatrix.push(displayRow);
    }
    
    // 渲染卡牌
    renderCards2d();
    
    // 显示操作按钮
    resetBtn2d.classList.remove('hidden');
    rotateBtn2d.classList.remove('hidden');
    clearSelectionBtn2d.classList.remove('hidden');
}

// 渲染二维卡牌
function renderCards2d() {
    // 清空容器
    cardsContainer2d.innerHTML = '';
    
    // 创建卡牌元素
    for (let i = 0; i < displayMatrix.length; i++) {
        for (let j = 0; j < displayMatrix[i].length; j++) {
            const item = displayMatrix[i][j];
            
            const card = document.createElement('div');
            card.className = item.flipped ? 'card flipped' : 'card normal';
            card.dataset.row = i;
            card.dataset.col = j;
            card.dataset.mode = '2d';
            
            // 设置卡牌大小
            card.style.width = `${cardSize}px`;
            card.style.height = `${Math.floor(cardSize * 1.2)}px`; // 二维模式使用更小的高度
            
            const cardNumber = document.createElement('div');
            cardNumber.className = 'card-number';
            cardNumber.textContent = item.value;
            cardNumber.style.fontSize = `${Math.floor(cardSize / 2)}px`;
            
            card.appendChild(cardNumber);
            cardsContainer2d.appendChild(card);
            
            // 添加事件
            card.addEventListener('mousedown', handleCardMouseDown);
            card.addEventListener('mouseover', handleCardMouseOver);
            card.addEventListener('mouseup', handleCardMouseUp);
        }
    }
    
    // 如果有选择区域，更新选择
    if (selectionStart.row !== null && selectionEnd.row !== null) {
        updateSelection2d();
    }
}

// 更新二维选择区域
function updateSelection2d() {
    if (selectionStart.row === null || selectionEnd.row === null) {
        console.log("无法更新选择区域，起点或终点未设置");
        return;
    }
    
    console.log("正在更新选择区域", selectionStart, "到", selectionEnd);
    
    // 清除所有卡牌的选中状态
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // 计算选择区域的范围
    const startRow = Math.min(selectionStart.row, selectionEnd.row);
    const endRow = Math.max(selectionStart.row, selectionEnd.row);
    const startCol = Math.min(selectionStart.col, selectionEnd.col);
    const endCol = Math.max(selectionStart.col, selectionEnd.col);
    
    console.log("最终选择范围：", startRow, startCol, "到", endRow, endCol);
    
    // 添加选中状态
    for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
            const card = document.querySelector(`.card[data-row="${i}"][data-col="${j}"]`);
            if (card) {
                card.classList.add('selected');
            } else {
                console.warn(`找不到卡牌 [${i},${j}]`);
            }
        }
    }
}

// 旋转选中的卡牌180°（二维模式）
function rotateSelectedCards2d() {
    if (selectionStart.row === null || selectionEnd.row === null) {
        alert('请先选择要旋转的卡牌区域');
        return;
    }
    
    // 计算选择区域的范围
    const startRow = Math.min(selectionStart.row, selectionEnd.row);
    const endRow = Math.max(selectionStart.row, selectionEnd.row);
    const startCol = Math.min(selectionStart.col, selectionEnd.col);
    const endCol = Math.max(selectionStart.col, selectionEnd.col);
    
    // 提取选中的区域
    const selectedArea = [];
    for (let i = startRow; i <= endRow; i++) {
        const row = [];
        for (let j = startCol; j <= endCol; j++) {
            row.push({...displayMatrix[i][j]});
        }
        selectedArea.push(row);
    }
    
    // 旋转180°
    // 注意：旋转180°等同于从末尾开始重新排列，同时反转flipped状态
    let rotatedArea = [];
    for (let i = selectedArea.length - 1; i >= 0; i--) {
        const rotatedRow = [];
        for (let j = selectedArea[i].length - 1; j >= 0; j--) {
            const cell = selectedArea[i][j];
            rotatedRow.push({
                value: cell.value,
                flipped: !cell.flipped
            });
        }
        rotatedArea.push(rotatedRow);
    }
    
    // 替换原矩阵中的选中区域
    for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
            // 计算在旋转区域中的相对位置
            const rowOffset = i - startRow;
            const colOffset = j - startCol;
            displayMatrix[i][j] = rotatedArea[rowOffset][colOffset];
        }
    }
    
    // 重新渲染卡牌
    renderCards2d();
    
    // 高亮显示修改区域
    for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
            const card = document.querySelector(`.card[data-row="${i}"][data-col="${j}"]`);
            if (card) {
                card.classList.add('highlight');
                setTimeout(() => {
                    card.classList.remove('highlight');
                }, 500);
            }
        }
    }
    
    // 清除选择
    clearSelection();
}

// 二维矩阵循环移动
function moveMatrix2d(direction) {
    let arrowElement;
    switch (direction) {
        case 'left':
            arrowElement = leftArrow2d;
            break;
        case 'right':
            arrowElement = rightArrow2d;
            break;
        case 'up':
            arrowElement = upArrow;
            break;
        case 'down':
            arrowElement = downArrow;
            break;
    }
    
    handleAnimation(direction, arrowElement, () => {
        // 执行矩阵移动
        switch (direction) {
            case 'left':
                moveMatrixLeft();
                break;
            case 'right':
                moveMatrixRight();
                break;
            case 'up':
                moveMatrixUp();
                break;
            case 'down':
                moveMatrixDown();
                break;
        }
        
        // 重新渲染卡牌
        renderCards2d();
    });
}

// 矩阵向左循环移动
function moveMatrixLeft() {
    for (let i = 0; i < matrixRows; i++) {
        // 提取当前行
        const row = displayMatrix[i];
        // 第一个元素移到末尾
        const firstItem = row.shift();
        row.push(firstItem);
        // 更新矩阵
        displayMatrix[i] = row;
    }
}

// 矩阵向右循环移动
function moveMatrixRight() {
    for (let i = 0; i < matrixRows; i++) {
        // 提取当前行
        const row = displayMatrix[i];
        // 最后一个元素移到开头
        const lastItem = row.pop();
        row.unshift(lastItem);
        // 更新矩阵
        displayMatrix[i] = row;
    }
}

// 矩阵向上循环移动
function moveMatrixUp() {
    // 提取第一行
    const firstRow = displayMatrix.shift();
    // 将第一行添加到末尾
    displayMatrix.push(firstRow);
}

// 矩阵向下循环移动
function moveMatrixDown() {
    // 提取最后一行
    const lastRow = displayMatrix.pop();
    // 将最后一行添加到开头
    displayMatrix.unshift(lastRow);
}

// 重置所有卡牌（二维模式）
function resetAllCards2d() {
    // 重置矩阵
    displayMatrix = [];
    let counter = 1;
    
    for (let i = 0; i < matrixRows; i++) {
        const displayRow = [];
        
        for (let j = 0; j < matrixCols; j++) {
            displayRow.push({ value: counter, flipped: false });
            counter++;
        }
        
        displayMatrix.push(displayRow);
    }
    
    // 重新渲染
    renderCards2d();
    
    // 清除选择
    clearSelection();
    
    // 添加高亮动画
    document.querySelectorAll('.card').forEach(card => {
        card.classList.add('highlight');
        setTimeout(() => {
            card.classList.remove('highlight');
        }, 500);
    });
}

// 清除所有选择
function clearSelection() {
    if (currentMode === '1d') {
        selectedIndices = [];
    }
    // 在二维模式下，保留selectionStart和selectionEnd，仅在模式切换时才完全重置
    if (modeSelect.value !== '2d') {
        selectionStart = { row: null, col: null };
        selectionEnd = { row: null, col: null };
    }
    
    // 清除所有卡牌的选中状态
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('selected');
    });
}

// 添加监听，确保在文档范围内释放鼠标时也结束选择
document.addEventListener('mouseup', () => {
    isSelecting = false;
});