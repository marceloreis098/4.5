app.put('/api/licenses/:id', (req, res) => {
    const { id } = req.params;
    const { license, username } = req.body;
    
    // Remove o campo 'id' e outros campos de sistema do objeto de atualização para evitar erros de SQL
    // ao tentar atualizar a chave primária ou campos de controle
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