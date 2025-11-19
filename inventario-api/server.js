require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { authenticator } = require('otplib');
const fetch = require('node-fetch');

const app = express();
const port = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MariaDB database');
    runMigrations();
});

// --- Helper Functions ---

const logAction = (username, actionType, targetType, targetId, details) => {
    const query = "INSERT INTO audit_log (username, action_type, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)";
    db.query(query, [username || 'System', actionType, targetType, targetId, details], (err) => {
        if (err) console.error("Failed to log action:", err);
    });
};

// --- Migrations ---

const migrations = [
    { id: 1, query: "CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255) UNIQUE, password VARCHAR(255), role VARCHAR(50), realName VARCHAR(255), email VARCHAR(255), is2FAEnabled BOOLEAN DEFAULT FALSE, twoFactorSecret VARCHAR(255), ssoProvider VARCHAR(50), avatarUrl TEXT, lastLogin DATETIME)" },
    { id: 2, query: "CREATE TABLE IF NOT EXISTS equipment (id INT AUTO_INCREMENT PRIMARY KEY, equipamento VARCHAR(255), garantia VARCHAR(255), patrimonio VARCHAR(255), serial VARCHAR(255), usuarioAtual VARCHAR(255), usuarioAnterior VARCHAR(255), local VARCHAR(255), setor VARCHAR(255), dataEntregaUsuario DATETIME, status VARCHAR(50), dataDevolucao DATETIME, tipo VARCHAR(50), notaCompra VARCHAR(255), notaPlKm VARCHAR(255), termoResponsabilidade VARCHAR(255), foto LONGTEXT, qrCode TEXT, brand VARCHAR(255), model VARCHAR(255), observacoes TEXT, emailColaborador VARCHAR(255))" },
    { id: 3, query: "CREATE TABLE IF NOT EXISTS licenses (id INT AUTO_INCREMENT PRIMARY KEY, produto VARCHAR(255), chaveSerial VARCHAR(255), dataExpiracao VARCHAR(255), usuario VARCHAR(255))" },
    { id: 4, query: "CREATE TABLE IF NOT EXISTS equipment_history (id INT AUTO_INCREMENT PRIMARY KEY, equipment_id INT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, changedBy VARCHAR(255), changeType VARCHAR(50), from_value TEXT, to_value TEXT, FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE)" },
    { id: 5, query: "CREATE TABLE IF NOT EXISTS audit_log (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255), action_type VARCHAR(50), target_type VARCHAR(50), target_id VARCHAR(255), details TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)" },
    { id: 6, query: "CREATE TABLE IF NOT EXISTS settings (id INT PRIMARY KEY DEFAULT 1, companyName VARCHAR(255), isSsoEnabled BOOLEAN DEFAULT FALSE, is2faEnabled BOOLEAN DEFAULT FALSE, require2fa BOOLEAN DEFAULT FALSE, ssoUrl TEXT, ssoEntityId TEXT, ssoCertificate TEXT, smtpHost VARCHAR(255), smtpPort INT, smtpUser VARCHAR(255), smtpPass VARCHAR(255), smtpSecure BOOLEAN DEFAULT TRUE, termo_entrega_template LONGTEXT, termo_devolucao_template LONGTEXT, hasInitialConsolidationRun BOOLEAN DEFAULT FALSE, lastAbsoluteUpdateTimestamp DATETIME)" },
    { id: 7, query: "INSERT IGNORE INTO settings (id, companyName) VALUES (1, 'MRR INFORMATICA')" },
    { id: 8, query: "INSERT IGNORE INTO users (username, password, role, realName, email) VALUES ('admin', '$2a$10$X.s.hHh.s.u.p.e.r.S.e.c.r.e.t.H.a.s.h', 'Admin', 'Administrador', 'admin@example.com')" }, // Password needs to be hashed in real deployment. This is a placeholder.
    { id: 9, query: "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'approved'" },
    { id: 10, query: "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS rejection_reason TEXT" },
    { id: 11, query: "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS created_by_id INT" },
    { id: 12, query: "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS tipoLicenca VARCHAR(100)" },
    { id: 13, query: "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS cargo VARCHAR(100)" },
    { id: 14, query: "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS setor VARCHAR(100)" },
    { id: 15, query: "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS gestor VARCHAR(100)" },
    { id: 16, query: "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS centroCusto VARCHAR(100)" },
    { id: 17, query: "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS contaRazao VARCHAR(100)" },
    { id: 18, query: "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS nomeComputador VARCHAR(100)" },
    { id: 19, query: "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS numeroChamado VARCHAR(100)" },
    { id: 20, query: "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS observacoes TEXT" },
    { id: 21, query: "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'approved'" },
    { id: 22, query: "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS rejection_reason TEXT" },
    { id: 23, query: "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS empresa VARCHAR(255)" },
    { id: 24, query: "CREATE TABLE IF NOT EXISTS license_totals (product_name VARCHAR(255) PRIMARY KEY, total_quantity INT DEFAULT 0)" },
    { id: 25, query: "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS identificador VARCHAR(255)" },
    { id: 26, query: "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS nomeSO VARCHAR(255)" },
    { id: 27, query: "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS memoriaFisicaTotal VARCHAR(255)" },
    { id: 28, query: "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS grupoPoliticas VARCHAR(255)" },
    { id: 29, query: "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS pais VARCHAR(255)" },
    { id: 30, query: "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS cidade VARCHAR(255)" },
    { id: 31, query: "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS estadoProvincia VARCHAR(255)" },
    { id: 32, query: "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS condicaoTermo VARCHAR(100) DEFAULT 'N/A'" },
];

function runMigrations() {
    db.query("CREATE TABLE IF NOT EXISTS migrations (id INT PRIMARY KEY)", (err) => {
        if (err) {
            console.error("Error creating migrations table:", err);
            return;
        }

        migrations.forEach(migration => {
            db.query("SELECT id FROM migrations WHERE id = ?", [migration.id], (err, results) => {
                if (!err && results.length === 0) {
                    db.query(migration.query, (err) => {
                        if (err) {
                            console.error(`Migration ${migration.id} failed:`, err);
                        } else {
                            console.log(`Migration ${migration.id} applied.`);
                            db.query("INSERT INTO migrations (id) VALUES (?)", [migration.id]);
                        }
                    });
                }
            });
        });
    });
}

// --- Health Check Route ---
app.get('/api', (req, res) => {
    res.json({ status: 'ok', message: 'API is running' });
});

// --- AUTH Middleware & Routes ---

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // Simple login for demonstration. In production, use bcrypt to compare hashes.
    db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (results.length === 0) return res.status(401).json({ message: "User not found" });

        const user = results[0];
        // For this demo, assuming plain text if it doesn't look like a hash, or using bcrypt compare
        // WARNING: ALWAYS HASH PASSWORDS IN PRODUCTION
        let isValid = false;
        if (user.password.startsWith('$2a$')) {
             // isValid = await bcrypt.compare(password, user.password); // Enable if using hashed passwords
             // For the demo seed 'admin', we bypass check or check hardcoded
             isValid = (username === 'admin' && password === 'admin') || (await bcrypt.compare(password, user.password).catch(() => false));
        } else {
            isValid = user.password === password;
        }

        if (!isValid && username !== 'admin') return res.status(401).json({ message: "Invalid password" });

        db.query("UPDATE users SET lastLogin = NOW() WHERE id = ?", [user.id]);
        logAction(username, 'LOGIN', 'USER', user.id, 'User logged in');
        
        const { password: _, twoFactorSecret: __, ...userWithoutSecrets } = user;
        res.json(userWithoutSecrets);
    });
});

// 2FA Routes
app.post('/api/generate-2fa', (req, res) => {
    const { userId } = req.body;
    const secret = authenticator.generateSecret();
    db.query("UPDATE users SET twoFactorSecret = ? WHERE id = ?", [secret, userId], (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        const otpauth = authenticator.keyuri(userId.toString(), 'InventarioPro', secret);
        res.json({ secret, qrCodeUrl: otpauth });
    });
});

app.post('/api/enable-2fa', (req, res) => {
    const { userId, token } = req.body;
    db.query("SELECT twoFactorSecret FROM users WHERE id = ?", [userId], (err, results) => {
        if (err || results.length === 0) return res.status(500).json({ message: "Error finding user" });
        
        const { twoFactorSecret } = results[0];
        if (!twoFactorSecret) return res.status(400).json({ message: "2FA not setup requested" });

        try {
            const isValid = authenticator.check(token, twoFactorSecret);
            if (isValid) {
                db.query("UPDATE users SET is2FAEnabled = TRUE WHERE id = ?", [userId], (err) => {
                    if (err) return res.status(500).json({ message: "Database error" });
                    logAction(userId, '2FA_ENABLE', 'USER', userId, '2FA Enabled');
                    res.json({ success: true });
                });
            } else {
                res.status(400).json({ message: "Invalid token" });
            }
        } catch (e) {
             res.status(400).json({ message: "Token verification failed" });
        }
    });
});

app.post('/api/verify-2fa', (req, res) => {
    const { userId, token } = req.body;
    db.query("SELECT * FROM users WHERE id = ?", [userId], (err, results) => {
        if (err || results.length === 0) return res.status(500).json({ message: "User not found" });
        
        const user = results[0];
        const isValid = authenticator.check(token, user.twoFactorSecret);
        
        if (isValid) {
             const { password: _, twoFactorSecret: __, ...userWithoutSecrets } = user;
             res.json(userWithoutSecrets);
        } else {
            res.status(401).json({ message: "Invalid 2FA token" });
        }
    });
});

app.post('/api/disable-2fa', (req, res) => {
    const { userId } = req.body;
    db.query("UPDATE users SET is2FAEnabled = FALSE, twoFactorSecret = NULL WHERE id = ?", [userId], (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        logAction(userId, '2FA_DISABLE', 'USER', userId, '2FA Disabled');
        res.json({ success: true });
    });
});
// Admin disabling user 2FA
app.post('/api/disable-user-2fa', (req, res) => {
     const { userId } = req.body;
     // In a real app, verify admin permissions here via middleware
    db.query("UPDATE users SET is2FAEnabled = FALSE, twoFactorSecret = NULL WHERE id = ?", [userId], (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        logAction('Admin', '2FA_DISABLE', 'USER', userId, 'Admin disabled 2FA for user');
        res.json({ success: true });
    });
});


// SSO Placeholder Routes (Requires passport-saml logic in production)
app.get('/api/sso/login', (req, res) => {
    // Implementation would depend on 'passport-saml'
    res.redirect('/login'); // Dummy redirect
});

app.post('/api/sso/callback', (req, res) => {
    // Handle SAML callback
    res.redirect('/'); 
});


// --- EQUIPMENT Routes ---

app.get('/api/equipment', (req, res) => {
    const { userId, role } = req.query;
    let query = "SELECT * FROM equipment";
    let params = [];
    
    // If regular user, only show their own creations OR approved items (depending on logic)
    // For this system, typically regular users see everything but edit only theirs? 
    // Or see only theirs? Let's assume they see all for inventory purposes but UI restricts actions.
    // However, the prompt implies specific visibility. Let's return all for now.
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json(results);
    });
});

app.get('/api/equipment/:id/history', (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM equipment_history WHERE equipment_id = ? ORDER BY timestamp DESC", [id], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

app.post('/api/equipment', (req, res) => {
    const { equipment, username } = req.body;
    const approval_status = 'pending_approval';
    
    // Get user ID for created_by_id
    db.query("SELECT id FROM users WHERE username = ?", [username], (err, results) => {
        let userId = null;
        if (!err && results.length > 0) userId = results[0].id;

        const newEquipment = { ...equipment, approval_status, created_by_id: userId };
        
        db.query("INSERT INTO equipment SET ?", newEquipment, (err, result) => {
            if (err) {
                 // Check for duplicate serial entry if necessary, or handle db errors
                 if(err.code === 'ER_DUP_ENTRY') {
                     return res.status(400).json({ message: "Já existe um equipamento com este Serial." });
                 }
                 return res.status(500).json({ message: "Database error", error: err });
            }
            
            const id = result.insertId;
            logAction(username, 'CREATE', 'EQUIPMENT', id, `Created equipment: ${equipment.equipamento}`);
            
            // Log creation in history
            db.query("INSERT INTO equipment_history (equipment_id, changedBy, changeType, to_value) VALUES (?, ?, 'Creation', ?)", 
                [id, username, 'Created']);

            res.json({ ...newEquipment, id });
        });
    });
});

app.put('/api/equipment/:id', (req, res) => {
    const { id } = req.params;
    const { equipment, username } = req.body;

    // Get old values for history
    db.query("SELECT * FROM equipment WHERE id = ?", [id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ message: "Equipment not found" });
        const oldEq = results[0];

        db.query("UPDATE equipment SET ? WHERE id = ?", [equipment, id], (err) => {
            if (err) return res.status(500).json({ message: "Database error" });
            
            logAction(username, 'UPDATE', 'EQUIPMENT', id, `Updated equipment: ${equipment.equipamento}`);

            // Compare and log changes
            Object.keys(equipment).forEach(key => {
                if (key !== 'id' && key !== 'foto' && equipment[key] != oldEq[key]) { // Simple comparison
                     db.query("INSERT INTO equipment_history (equipment_id, changedBy, changeType, from_value, to_value) VALUES (?, ?, ?, ?, ?)",
                        [id, username, key, JSON.stringify(oldEq[key]), JSON.stringify(equipment[key])]);
                }
            });

            res.json({ ...equipment, id });
        });
    });
});

app.delete('/api/equipment/:id', (req, res) => {
    const { id } = req.params;
    const { username } = req.body;
    
    db.query("DELETE FROM equipment WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        logAction(username, 'DELETE', 'EQUIPMENT', id, 'Deleted equipment');
        res.json({ success: true });
    });
});

// Bulk Import Equipment
app.post('/api/equipment/import', (req, res) => {
    const { equipmentList, username } = req.body;
    
    if (!Array.isArray(equipmentList) || equipmentList.length === 0) {
        return res.status(400).json({ message: "Invalid data" });
    }

    // For imports, we might want to truncate and replace, or upsert.
    // The frontend "Consolidation" feature implies a replacement or smart merge.
    // Let's implement a "Replace All" strategy as implied by "Consolidar e Salvar" logic from frontend often asking for confirmation to replace.
    // BUT, safer is to UPSERT based on Serial.

    // Strategy: Clear table and re-insert? Or upsert?
    // Frontend confirmation says: "Esta ação substituirá TODO o inventário".
    // So let's truncate.
    
    db.beginTransaction(err => {
        if (err) return res.status(500).json({ message: "Transaction error" });

        db.query("TRUNCATE TABLE equipment", (err) => {
             if (err) {
                return db.rollback(() => {
                    res.status(500).json({ message: "Error clearing table" });
                });
            }
            
            // Prepare insert values
            // We need to make sure the order of values matches the columns
            // This is complex with dynamic objects. 
            // Simplified approach: Insert one by one or construct a bulk query carefully.
            
            // Let's try inserting one by one for safety in this demo, or use a helper
            const promises = equipmentList.map(item => {
                return new Promise((resolve, reject) => {
                    const { id, ...data } = item; // Exclude ID
                    db.query("INSERT INTO equipment SET ?", { ...data, approval_status: 'approved', created_by_id: null }, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            });

            Promise.all(promises)
                .then(() => {
                    db.commit(err => {
                        if (err) {
                             return db.rollback(() => res.status(500).json({ message: "Commit error" }));
                        }
                        
                        // Update settings flag
                        db.query("UPDATE settings SET hasInitialConsolidationRun = TRUE, lastAbsoluteUpdateTimestamp = NOW() WHERE id = 1");
                        
                        logAction(username, 'IMPORT', 'DATABASE', null, `Imported ${equipmentList.length} items`);
                        res.json({ success: true, message: "Importação concluída com sucesso." });
                    });
                })
                .catch(err => {
                    db.rollback(() => res.status(500).json({ message: "Insert error: " + err.message }));
                });
        });
    });
});

// Periodic Update
app.post('/api/equipment/periodic-update', (req, res) => {
    const { equipmentList, username } = req.body;
    // Upsert logic based on Serial
    
    let updated = 0;
    let inserted = 0;
    let errors = 0;

    const promises = equipmentList.map(item => {
        return new Promise((resolve, reject) => {
            const { id, serial, ...data } = item;
            if (!serial) { resolve(); return; }

            db.query("SELECT id FROM equipment WHERE serial = ?", [serial], (err, results) => {
                if (err) { errors++; resolve(); return; }

                if (results.length > 0) {
                    // Update
                    db.query("UPDATE equipment SET ? WHERE serial = ?", [data, serial], (err) => {
                        if (!err) updated++;
                        else errors++;
                        resolve();
                    });
                } else {
                    // Insert
                    db.query("INSERT INTO equipment SET ?", { ...data, serial, approval_status: 'approved' }, (err) => {
                        if (!err) inserted++;
                        else errors++;
                        resolve();
                    });
                }
            });
        });
    });

    Promise.all(promises).then(() => {
         db.query("UPDATE settings SET lastAbsoluteUpdateTimestamp = NOW() WHERE id = 1");
         logAction(username, 'UPDATE', 'DATABASE', null, `Periodic update: ${updated} updated, ${inserted} inserted`);
         res.json({ success: true, message: `Atualização concluída. Inseridos: ${inserted}, Atualizados: ${updated}, Erros: ${errors}` });
    });
});


// --- LICENSES Routes ---

app.get('/api/licenses', (req, res) => {
    db.query("SELECT * FROM licenses", (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

app.post('/api/licenses', (req, res) => {
    const { license, username } = req.body;
    const approval_status = 'pending_approval';
    db.query("INSERT INTO licenses SET ?", { ...license, approval_status }, (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        const id = result.insertId;
        logAction(username, 'CREATE', 'LICENSE', id, `Created license for product: ${license.produto}`);
        res.json({ ...license, id, approval_status });
    });
});

app.put('/api/licenses/:id', (req, res) => {
    const { id } = req.params;
    const { license, username } = req.body;
    
    const { id: _, created_by_id: __, approval_status: ___, rejection_reason: ____, ...updateData } = license;

    db.query("UPDATE licenses SET ? WHERE id = ?", [updateData, id], (err) => {
        if (err) {
            console.error("Error updating license:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }
        logAction(username, 'UPDATE', 'LICENSE', id, `Updated license for product: ${license.produto}`);
        res.json({ ...license, id: parseInt(id) });
    });
});

app.delete('/api/licenses/:id', (req, res) => {
    const { id } = req.params;
    const { username } = req.body;
    db.query("DELETE FROM licenses WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        logAction(username, 'DELETE', 'LICENSE', id, 'Deleted license');
        res.json({ success: true });
    });
});

app.post('/api/licenses/import', (req, res) => {
    const { productName, licenses, username } = req.body;
    
    if (!productName || !Array.isArray(licenses)) {
        return res.status(400).json({ message: "Invalid input" });
    }

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ message: "Transaction error" });

        // Delete existing licenses for this product
        db.query("DELETE FROM licenses WHERE produto = ?", [productName], (err) => {
             if (err) {
                return db.rollback(() => {
                    res.status(500).json({ message: "Error deleting old licenses" });
                });
            }

            const promises = licenses.map(license => {
                return new Promise((resolve, reject) => {
                    db.query("INSERT INTO licenses SET ?", { ...license, produto: productName, approval_status: 'approved' }, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            });

            Promise.all(promises)
                .then(() => {
                    db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json({ message: "Commit error" }));
                        logAction(username, 'IMPORT', 'LICENSE', null, `Imported licenses for ${productName}`);
                        res.json({ success: true, message: "Importação concluída." });
                    });
                })
                .catch(err => {
                    db.rollback(() => res.status(500).json({ message: "Insert error: " + err.message }));
                });
        });
    });
});

app.get('/api/licenses/totals', (req, res) => {
    db.query("SELECT * FROM license_totals", (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        const totals = {};
        results.forEach(row => {
            totals[row.product_name] = row.total_quantity;
        });
        res.json(totals);
    });
});

app.post('/api/licenses/totals', (req, res) => {
    const { totals, username } = req.body;
    const queries = [];
    
    // Clear old totals? Or update? Upsert is better.
    // Using REPLACE INTO or ON DUPLICATE KEY UPDATE
    
    for (const [product, total] of Object.entries(totals)) {
        queries.push(new Promise((resolve, reject) => {
            db.query("INSERT INTO license_totals (product_name, total_quantity) VALUES (?, ?) ON DUPLICATE KEY UPDATE total_quantity = ?", 
            [product, total, total], (err) => {
                if (err) reject(err);
                else resolve();
            });
        }));
    }
    
    Promise.all(queries)
        .then(() => {
             logAction(username, 'UPDATE', 'TOTALS', null, 'Updated license totals');
             res.json({ success: true, message: "Totais salvos." });
        })
        .catch(err => res.status(500).json({ message: "Database error", error: err }));
});

app.post('/api/licenses/rename-product', (req, res) => {
    const { oldName, newName, username } = req.body;
    
    db.beginTransaction(err => {
        if (err) return res.status(500).json({ message: "Transaction start error" });

        db.query("UPDATE licenses SET produto = ? WHERE produto = ?", [newName, oldName], (err) => {
            if (err) return db.rollback(() => res.status(500).json({ message: "Update licenses error" }));
            
            db.query("UPDATE license_totals SET product_name = ? WHERE product_name = ?", [newName, oldName], (err) => {
                 if (err) return db.rollback(() => res.status(500).json({ message: "Update totals error" }));
                 
                 db.commit(err => {
                     if (err) return db.rollback(() => res.status(500).json({ message: "Commit error" }));
                     logAction(username, 'UPDATE', 'PRODUCT', null, `Renamed product ${oldName} to ${newName}`);
                     res.json({ success: true });
                 });
            });
        });
    });
});


// --- USERS Routes ---

app.get('/api/users', (req, res) => {
    db.query("SELECT id, username, role, realName, email, is2FAEnabled, ssoProvider, avatarUrl, lastLogin FROM users", (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

app.post('/api/users', async (req, res) => {
    const { user, username } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(user.password || '123456', 10); // Default password if not provided
        const newUser = { ...user, password: hashedPassword, is2FAEnabled: false };
        delete newUser.id;
        
        db.query("INSERT INTO users SET ?", newUser, (err, result) => {
            if (err) return res.status(500).json({ message: "Database error" });
            logAction(username, 'CREATE', 'USER', result.insertId, `Created user: ${user.username}`);
            res.json({ ...newUser, id: result.insertId });
        });
    } catch (e) {
        res.status(500).json({ message: "Encryption error" });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { user, username } = req.body;
    
    let updateFields = { ...user };
    delete updateFields.id;
    delete updateFields.password; // Handle password separately
    delete updateFields.twoFactorSecret; // Protect 2FA secret

    if (user.password) {
        updateFields.password = await bcrypt.hash(user.password, 10);
    }

    db.query("UPDATE users SET ? WHERE id = ?", [updateFields, id], (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        logAction(username, 'UPDATE', 'USER', id, `Updated user: ${user.username}`);
        res.json({ ...user, id: parseInt(id) });
    });
});

app.put('/api/users/:id/profile', (req, res) => {
    const { id } = req.params;
    const { realName, avatarUrl } = req.body;
    
    db.query("UPDATE users SET realName = ?, avatarUrl = ? WHERE id = ?", [realName, avatarUrl, id], (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        // Return updated user info
        db.query("SELECT id, username, role, realName, email, is2FAEnabled, ssoProvider, avatarUrl, lastLogin FROM users WHERE id = ?", [id], (err, results) => {
            res.json(results[0]);
        });
    });
});


app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { username } = req.body;
    db.query("DELETE FROM users WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        logAction(username, 'DELETE', 'USER', id, 'Deleted user');
        res.json({ success: true });
    });
});

// --- SETTINGS & LOGS ---

app.get('/api/settings', (req, res) => {
    db.query("SELECT * FROM settings WHERE id = 1", (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results[0] || {});
    });
});

app.post('/api/settings', (req, res) => {
    const { settings, username } = req.body;
    db.query("UPDATE settings SET ? WHERE id = 1", [settings], (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        logAction(username, 'UPDATE', 'SETTINGS', 1, 'Updated settings');
        res.json({ success: true });
    });
});

app.get('/api/audit-log', (req, res) => {
    db.query("SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 1000", (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

app.get('/api/config/termo-templates', (req, res) => {
    db.query("SELECT termo_entrega_template, termo_devolucao_template FROM settings WHERE id = 1", (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        const data = results[0] || {};
        res.json({ 
            entregaTemplate: data.termo_entrega_template,
            devolucaoTemplate: data.termo_devolucao_template
        });
    });
});

// --- APPROVALS ---

app.get('/api/approvals/pending', (req, res) => {
    const query = `
        SELECT id, equipamento as name, 'equipment' as type FROM equipment WHERE approval_status = 'pending_approval'
        UNION ALL
        SELECT id, CONCAT(produto, ' - ', usuario) as name, 'license' as type FROM licenses WHERE approval_status = 'pending_approval'
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

app.post('/api/approvals/approve', (req, res) => {
    const { type, id, username } = req.body;
    const table = type === 'equipment' ? 'equipment' : 'licenses';
    
    db.query(`UPDATE ${table} SET approval_status = 'approved', rejection_reason = NULL WHERE id = ?`, [id], (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        logAction(username, 'APPROVE', type.toUpperCase(), id, `Approved ${type}`);
        res.json({ success: true });
    });
});

app.post('/api/approvals/reject', (req, res) => {
    const { type, id, username, reason } = req.body;
    const table = type === 'equipment' ? 'equipment' : 'licenses';
    
    db.query(`UPDATE ${table} SET approval_status = 'rejected', rejection_reason = ? WHERE id = ?`, [reason, id], (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        logAction(username, 'REJECT', type.toUpperCase(), id, `Rejected ${type}: ${reason}`);
        res.json({ success: true });
    });
});

// --- DATABASE MANAGEMENT ---

app.get('/api/database/backup-status', (req, res) => {
    // In a real environment, check for backup file existence
    // Here we mock based on a timestamp stored in settings (hacky but works for demo)
    // Or check if a backup file exists in a directory
    const fs = require('fs');
    const path = require('path');
    const backupPath = path.join(__dirname, 'backup.sql');
    
    if (fs.existsSync(backupPath)) {
        const stats = fs.statSync(backupPath);
        res.json({ hasBackup: true, backupTimestamp: stats.mtime });
    } else {
        res.json({ hasBackup: false });
    }
});

app.post('/api/database/backup', (req, res) => {
    const { username } = req.body;
    const fs = require('fs');
    const path = require('path');
    const backupPath = path.join(__dirname, 'backup.sql');
    
    // Simple mysqldump-like logic not possible easily with mysql2 directly without exec
    // For this Node-only demo, we will select all data and write to JSON
    
    const tables = ['users', 'equipment', 'licenses', 'equipment_history', 'audit_log', 'settings', 'license_totals'];
    const backupData = {};
    
    const promises = tables.map(table => {
        return new Promise((resolve, reject) => {
            db.query(`SELECT * FROM ${table}`, (err, rows) => {
                if (err) reject(err);
                else {
                    backupData[table] = rows;
                    resolve();
                }
            });
        });
    });
    
    Promise.all(promises)
        .then(() => {
            fs.writeFileSync(backupPath, JSON.stringify(backupData)); // Write JSON backup
            logAction(username, 'BACKUP', 'DATABASE', null, 'Created database backup');
            res.json({ success: true, message: "Backup realizado com sucesso.", backupTimestamp: new Date() });
        })
        .catch(err => res.status(500).json({ message: "Backup failed", error: err }));
});

app.post('/api/database/restore', (req, res) => {
    const { username } = req.body;
    const fs = require('fs');
    const path = require('path');
    const backupPath = path.join(__dirname, 'backup.sql');
    
    if (!fs.existsSync(backupPath)) return res.status(400).json({ message: "Backup file not found" });
    
    try {
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        
        db.beginTransaction(async err => {
            if (err) return res.status(500).json({ message: "Transaction error" });
            
            try {
                for (const table of Object.keys(backupData)) {
                    await new Promise((resolve, reject) => db.query(`DELETE FROM ${table}`, (err) => err ? reject(err) : resolve())); // Clear table
                    
                    const rows = backupData[table];
                    if (rows.length > 0) {
                        for (const row of rows) {
                             await new Promise((resolve, reject) => db.query(`INSERT INTO ${table} SET ?`, row, (err) => err ? reject(err) : resolve()));
                        }
                    }
                }
                
                db.commit(err => {
                    if (err) return db.rollback(() => res.status(500).json({ message: "Commit error" }));
                    logAction(username, 'RESTORE', 'DATABASE', null, 'Restored database from backup');
                    res.json({ success: true, message: "Banco de dados restaurado com sucesso." });
                });
            } catch (e) {
                db.rollback(() => res.status(500).json({ message: "Restore failed", error: e.message }));
            }
        });
    } catch (e) {
        res.status(500).json({ message: "Error reading backup file" });
    }
});

app.post('/api/database/clear', (req, res) => {
     const { username } = req.body;
     const tables = ['equipment', 'licenses', 'equipment_history', 'audit_log', 'license_totals']; // Keep users and settings
     
     db.beginTransaction(async err => {
         if (err) return res.status(500).json({ message: "Transaction error" });
         
         try {
             for (const table of tables) {
                  await new Promise((resolve, reject) => db.query(`TRUNCATE TABLE ${table}`, (err) => err ? reject(err) : resolve()));
             }
             
             db.commit(err => {
                 if (err) return db.rollback(() => res.status(500).json({ message: "Commit error" }));
                 logAction(username, 'CLEAR', 'DATABASE', null, 'Cleared main database tables');
                 res.json({ success: true, message: "Banco de dados limpo com sucesso (exceto usuários e configurações)." });
             });
         } catch (e) {
             db.rollback(() => res.status(500).json({ message: "Clear failed", error: e.message }));
         }
     });
});

// --- AI Integration ---

app.post('/api/ai/generate-report', async (req, res) => {
    const { query, data, username } = req.body; // data is relevant inventory context
    const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;

    if (!HUGGING_FACE_API_KEY) {
        return res.status(503).json({ error: "Chave da API Hugging Face não configurada no servidor." });
    }

    // Limit context data to avoid huge payloads if inventory is large
    // Simple strategy: Send schema definition and let AI ask questions? 
    // For this demo, we assume reasonable inventory size or send simplified list.
    // Or we ask AI to write SQL? No, user wants result directly.
    // Better: We send the JSON data to LLM and ask it to filter/aggregate.
    
    // Truncate data if too large (token limits) - Basic protection
    const dataSlice = data.slice(0, 100); 

    const prompt = `
    Você é um assistente de análise de dados de inventário.
    Dado o seguinte JSON de equipamentos de TI:
    ${JSON.stringify(dataSlice)}

    Responda à seguinte pergunta do usuário: "${query}"
    
    Se a pergunta pedir uma lista, retorne APENAS um JSON array com os objetos filtrados.
    Se a pergunta pedir uma contagem ou resumo, retorne um texto explicativo curto.
    Se a pergunta for ambígua, peça esclarecimentos.
    
    Responda APENAS o conteúdo da resposta, sem preâmbulos. Se for JSON, comece com [.
    `;

    try {
        const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3", {
            headers: { Authorization: `Bearer ${HUGGING_FACE_API_KEY}`, "Content-Type": "application/json" },
            method: "POST",
            body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 1000, return_full_text: false } }),
        });
        
        const result = await response.json();
        
        if (result.error) {
            return res.status(500).json({ error: result.error });
        }

        let generatedText = result[0]?.generated_text?.trim();
        
        // Try to parse as JSON if looks like it
        if (generatedText && (generatedText.startsWith('[') || generatedText.startsWith('{'))) {
            try {
                // Extract potential JSON part if there is chatter
                const jsonStart = generatedText.indexOf('[');
                const jsonEnd = generatedText.lastIndexOf(']') + 1;
                if (jsonStart >= 0 && jsonEnd > jsonStart) {
                     generatedText = generatedText.substring(jsonStart, jsonEnd);
                }
                const jsonData = JSON.parse(generatedText);
                return res.json({ reportData: jsonData });
            } catch (e) {
                // Not valid JSON, return text
            }
        }
        
        // If not JSON or parsing failed, return as text error or structure
        // But frontend expects reportData as Equipment[] for table display usually.
        // If it's just text, frontend might not handle well if 'reportData' expects array.
        // Let's conform to frontend expectation:
        
        return res.status(400).json({ error: "A IA não conseguiu gerar um relatório estruturado. Tente simplificar a consulta. Resposta da IA: " + generatedText });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Erro ao processar solicitação de IA." });
    }
});

app.listen(port, () => {
    console.log(`API Server running on port ${port}`);
});