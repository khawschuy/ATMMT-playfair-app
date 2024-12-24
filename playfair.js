let playfairMatrix = [];
let letterMappings = new Map();

// Khởi tạo DOM
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Initializing components...');
        initThemeToggle();
        initCopyButton();
        initHistoryControls();
        initLetterReplace();
        loadHistory();
        console.log('All components initialized successfully');
    } catch (error) {
        console.error('Error during initialization:', error);
    }

    const encryptForm = document.getElementById('encrypt-form');
    const decryptForm = document.getElementById('decrypt-form');
    
    // Xử lý mã hóa
    encryptForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const key = document.getElementById('key').value.toUpperCase();
        const plaintext = document.getElementById('plaintext').value.toUpperCase();
        
        if (!key || !plaintext) {
            generateRandomString();
        }

        try {
            playfairMatrix = generatePlayfairMatrix(key);
            displayPlayfairGrid(playfairMatrix);
            
            const ciphertext = encrypt(plaintext, playfairMatrix);
            document.getElementById('ciphertext').value = ciphertext;
            document.getElementById('result').textContent = `Văn bản đã mã hóa: ${ciphertext}`;
            
            // Thêm vào lịch sử
            addToHistory('encrypt', plaintext, ciphertext);
        } catch (error) {
            // alert(error.message);
        }
    });
    
    // Xử lý giải mã
    decryptForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const ciphertext = document.getElementById('ciphertext').value.toUpperCase();
        
        if (!ciphertext) {
            alert('Vui lòng nhập văn bản cần giải mã!');
            return;
        }

        try {
            const plaintext = decrypt(ciphertext, playfairMatrix);
            document.getElementById('result').textContent = `Văn bản đã giải mã: ${plaintext}`;
            
            // Thêm vào lịch sử
            addToHistory('decrypt', ciphertext, plaintext);
        } catch (error) {
            //alert(error.message);
        }
    });
});

// Khởi tạo chức năng thay đổi theme
function initThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle');
    const body = document.body;
    
    // Load theme từ localStorage
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        themeBtn.textContent = '☀️ Light Mode';
    }
    
    themeBtn.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        themeBtn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}
// tạo key random
function generateRandomString() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    const length = 10;

    // Chuyển chuỗi characters thành một mảng để có thể loại bỏ ký tự đã chọn
    let availableCharacters = characters.split('');

    for (let i = 0; i < length; i++) {
        // Chọn một ký tự ngẫu nhiên từ mảng availableCharacters
        const randomIndex = Math.floor(Math.random() * availableCharacters.length);
        const randomChar = availableCharacters[randomIndex];

        // Thêm ký tự vào kết quả
        result += randomChar;

        // Loại bỏ ký tự đã chọn khỏi mảng availableCharacters
        availableCharacters.splice(randomIndex, 1);
    }

    // Đặt giá trị của ô input có id 'key' bằng chuỗi kết quả
    document.getElementById('key').value = result;
}

// Khởi tạo nút copy
function initCopyButton() {
    const copyBtn = document.getElementById('copy-result');
    copyBtn.addEventListener('click', () => {
        const result = document.getElementById('result').textContent;
        navigator.clipboard.writeText(result).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅ Đã copy!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        });
    });
}

// Khởi tạo chức năng thay thế ký tự
function initLetterReplace() {
    const letterFrom = document.getElementById('letter-from');
    const letterTo = document.getElementById('letter-to');
    
    if (letterFrom && letterTo) {
        function updateMapping() {
            const from = letterFrom.value;
            const to = letterTo.value;
            if (from && to) {
                letterMappings.set(from, to);
                console.log('Updated mapping:', from, '->', to);
            }
        }
        
        letterFrom.addEventListener('change', updateMapping);
        letterTo.addEventListener('change', updateMapping);
    } else {
        console.error('Letter replace elements not found');
    }
}

// Khởi tạo controls cho lịch sử
function initHistoryControls() {
    const clearBtn = document.getElementById('clear-history');
    clearBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử?')) {
            localStorage.removeItem('playfairHistory');
            document.getElementById('history-list').innerHTML = '';
        }
    });
}

// Load lịch sử
function loadHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) {
        console.error('History list element not found');
        return;
    }

    try {
        const history = JSON.parse(localStorage.getItem('playfairHistory') || '[]');
        console.log('Loaded history:', history);
        
        if (history.length === 0) {
            historyList.innerHTML = '<div class="history-empty">Chưa có lịch sử mã hóa</div>';
            return;
        }
        
        historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-header">
                    <span class="timestamp">${new Date(item.timestamp).toLocaleString()}</span>
                    <span class="operation-type ${item.type}">${item.type === 'encrypt' ? '🔒 Mã hóa' : '🔓 Giải mã'}</span>
                </div>
                <div class="history-content">
                    <div class="user-info">👤 ${item.userInfo || 'Không có thông tin người dùng'}</div>
                    <div class="text-field"><strong>Đầu vào:</strong> ${item.input}</div>
                    <div class="text-field"><strong>Đầu ra:</strong> ${item.output}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading history:', error);
        historyList.innerHTML = '<div class="history-error">Có lỗi khi tải lịch sử</div>';
    }
}

// Thêm vào lịch sử
function addToHistory(type, input, output) {
    const historyList = document.getElementById('history-list');
    const history = JSON.parse(localStorage.getItem('playfairHistory') || '[]');
    
    const userInfo = document.getElementById('user-info').value;
    
    const historyItem = {
        type,
        input,
        output,
        userInfo,
        timestamp: new Date().toISOString()
    };
    
    history.unshift(historyItem); // Thêm vào đầu mảng
    if (history.length > 10) history.pop(); // Giới hạn 10 mục
    
    localStorage.setItem('playfairHistory', JSON.stringify(history));
    loadHistory();
}

// Tạo ma trận Playfair từ khóa
function generatePlayfairMatrix(key) {
    const alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // Không bao gồm J
    let matrix = [];
    let used = new Set();
    
    // Xử lý khóa
    for (let char of key) {
        char = char.replace(/[J]/g, 'I');
        if (/[A-Z]/.test(char) && !used.has(char)) {
            // Áp dụng mapping nếu có
            if (letterMappings.has(char)) {
                char = letterMappings.get(char);
            }
            matrix.push(char);
            used.add(char);
        }
    }
    
    // Thêm các chữ cái còn lại
    for (let char of alphabet) {
        if (!used.has(char)) {
            matrix.push(char);
            used.add(char);
        }
    }
    
    // Chuyển thành ma trận 5x5
    let result = [];
    for (let i = 0; i < 5; i++) {
        result[i] = matrix.slice(i * 5, (i + 1) * 5);
    }
    
    return result;
}

// Hiển thị ma trận Playfair
function displayPlayfairGrid(matrix) {
    const gridDiv = document.getElementById('playfair-grid');
    
    let tableHTML = '<table border="1">';
    for (let row of matrix) {
        tableHTML += '<tr>';
        for (let cell of row) {
            tableHTML += `<td>${cell}</td>`;
        }
        tableHTML += '</tr>';
    }
    tableHTML += '</table>';
    
    gridDiv.innerHTML = tableHTML;
}

// Tìm vị trí của ký tự trong ma trận
function findPosition(char, matrix) {
    char = char.replace(/[J]/g, 'I');
    // Áp dụng mapping nếu có
    if (letterMappings.has(char)) {
        char = letterMappings.get(char);
    }
    
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            if (matrix[i][j] === char) {
                return [i, j];
            }
        }
    }
    throw new Error(`Không tìm thấy ký tự '${char}' trong ma trận`);
}

// Chuẩn bị văn bản để mã hóa
function prepareText(text) {
    // Áp dụng letter mappings
    for (const [from, to] of letterMappings) {
        text = text.replace(new RegExp(from, 'g'), to);
    }
    
    text = text.replace(/[J]/g, 'I').replace(/[^A-Z]/g, '');
    let result = '';
    
    for (let i = 0; i < text.length; i++) {
        result += text[i];
        if (i < text.length - 1) {
            if (text[i] === text[i + 1]) {
                result += 'X';
            }
        }
    }
    
    if (result.length % 2 !== 0) {
        result += 'X';
    }
    
    return result;
}

// Mã hóa văn bản
function encrypt(plaintext, matrix) {
    const prepared = prepareText(plaintext);
    let result = '';
    
    for (let i = 0; i < prepared.length; i += 2) {
        const char1 = prepared[i];
        const char2 = prepared[i + 1];
        const [row1, col1] = findPosition(char1, matrix);
        const [row2, col2] = findPosition(char2, matrix);
        
        if (row1 === row2) {
            // Cùng hàng
            result += matrix[row1][(col1 + 1) % 5];
            result += matrix[row2][(col2 + 1) % 5];
        } else if (col1 === col2) {
            // Cùng cột
            result += matrix[(row1 + 1) % 5][col1];
            result += matrix[(row2 + 1) % 5][col2];
        } else {
            // Tạo hình chữ nhật
            result += matrix[row1][col2];
            result += matrix[row2][col1];
        }
    }
    
    return result;
}

// Giải mã văn bản
function decrypt(ciphertext, matrix) {
    let result = '';
    
    for (let i = 0; i < ciphertext.length; i += 2) {
        const char1 = ciphertext[i];
        const char2 = ciphertext[i + 1];
        const [row1, col1] = findPosition(char1, matrix);
        const [row2, col2] = findPosition(char2, matrix);
        
        if (row1 === row2) {
            // Cùng hàng
            result += matrix[row1][(col1 + 4) % 5];
            result += matrix[row2][(col2 + 4) % 5];
        } else if (col1 === col2) {
            // Cùng cột
            result += matrix[(row1 + 4) % 5][col1];
            result += matrix[(row2 + 4) % 5][col2];
        } else {
            // Tạo hình chữ nhật
            result += matrix[row1][col2];
            result += matrix[row2][col1];
        }
    }
    
    // Áp dụng ngược letter mappings
    for (const [from, to] of letterMappings) {
        result = result.replace(new RegExp(to, 'g'), from);
    }
    
    return result;
}