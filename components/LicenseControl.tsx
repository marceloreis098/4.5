    const handleSaveProductNames = async (newProductNames: string[], renames: Record<string, string>) => {
        try {
            // 1. Check for deletions and if they are allowed
            const originalProductNames = new Set(productNames);
            const currentProductNames = new Set(newProductNames);
            const deletedProductNames: string[] = [];
            originalProductNames.forEach(name => {
                if (!currentProductNames.has(name)) {
                    deletedProductNames.push(name);
                }
            });
    
            const errors: string[] = [];
            deletedProductNames.forEach(name => {
                if (licenses.some(l => l.produto === name)) {
                    errors.push(`- "${name}" não pode ser removido pois ainda existem licenças associadas a ele.`);
                }
            });
    
            if (errors.length > 0) {
                alert(`Não foi possível salvar as alterações:\n${errors.join('\n')}`);
                return;
            }
    
            // 2. Process renames in the database for existing licenses
            const renamesEntries = Object.entries(renames) as [string, string][];
            const renamePromises = renamesEntries.map(([oldName, newName]) => 
                renameProduct(oldName, newName, currentUser.username)
            );
            if (renamePromises.length > 0) {
                await Promise.all(renamePromises);
            }
    
            // 3. Construct the new totals object based on the complete new list of product names
            const newTotals: Record<string, number> = {};
            const oldTotalsWithRenamesHandled = { ...totalLicenses };
            
            // Apply renames to the old totals object before building the new one
            renamesEntries.forEach(([key, value]) => {
                const oldName = key;
                const newName = value;
                if (oldTotalsWithRenamesHandled[oldName] !== undefined) {
                    oldTotalsWithRenamesHandled[newName] = oldTotalsWithRenamesHandled[oldName];
                    delete oldTotalsWithRenamesHandled[oldName];
                }
            });
    
            // Build the new totals object from the final list of names
            newProductNames.forEach(name => {
                // Preserve existing count or default to 0 for new products
                newTotals[name] = oldTotalsWithRenamesHandled[name] ?? 0;
            });
    
            // 4. Save the complete new totals object to the database
            const result = await saveLicenseTotals(newTotals, currentUser.username);
            if (result.success) {
                alert('Nomes de produtos e totais atualizados com sucesso.');
            } else {
                alert(`Erro ao salvar alterações: ${result.message}`);
            }
    
        } catch (error: any) {
            console.error("Failed to save product name changes:", error);
            alert(`Erro ao salvar alterações: ${error.message}`);
        } finally {
            // 5. Reload all data from server to ensure consistency
            loadLicensesAndProducts();
        }
    };