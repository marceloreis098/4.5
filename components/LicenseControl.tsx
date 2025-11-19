
import React, { useState, useEffect, useMemo } from 'react';
import { License, User, UserRole } from '../types';
import Icon from './common/Icon';
import { getLicenses, addLicense, updateLicense, deleteLicense, getLicenseTotals, saveLicenseTotals, renameProduct } from '../services/apiService';

interface LicenseControlProps {
    currentUser: User;
}

const LicenseFormModal: React.FC<{
    license: License | null;
    onClose: () => void;
    onSave: () => void;
    currentUser: User;
    productNames: string[];
}> = ({ license, onClose, onSave, currentUser, productNames }) => {
    const [formData, setFormData] = useState<Omit<License, 'id' | 'approval_status' | 'rejection_reason'>>({
        produto: '', chaveSerial: '', dataExpiracao: '', usuario: '',
        tipoLicenca: '', cargo: '', setor: '', gestor: '', centroCusto: '',
        contaRazao: '', nomeComputador: '', numeroChamado: '', observacoes: '',
        empresa: '' // Novo campo
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isNewProduct, setIsNewProduct] = useState(false);
    const [newProductName, setNewProductName] = useState('');

    useEffect(() => {
        if (license) {
            setFormData({
                produto: license.produto,
                chaveSerial: license.chaveSerial,
                dataExpiracao: license.dataExpiracao || '',
                usuario: license.usuario,
                tipoLicenca: license.tipoLicenca || '',
                cargo: license.cargo || '',
                setor: license.setor || '',
                gestor: license.gestor || '',
                centroCusto: license.centroCusto || '',
                contaRazao: license.contaRazao || '',
                nomeComputador: license.nomeComputador || '',
                numeroChamado: license.numeroChamado || '',
                observacoes: license.observacoes || '',
                empresa: license.empresa || ''
            });
        }
    }, [license]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        const productToSave = isNewProduct ? newProductName : formData.produto;
        
        if (!productToSave) {
            alert("Por favor, selecione ou digite um nome de produto.");
            setIsSaving(false);
            return;
        }

        try {
            const dataToSubmit = { ...formData, produto: productToSave };
            
            if (license) {
                await updateLicense({ ...dataToSubmit, id: license.id }, currentUser.username);
            } else {
                await addLicense(dataToSubmit, currentUser);
                if (currentUser.role !== UserRole.Admin) {
                    alert("Licença adicionada com sucesso! Aguardando aprovação.");
                }
            }
            onSave();
            onClose();
        } catch (error) {
            console.error("Failed to save license", error);
            alert("Erro ao salvar licença.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start sm:items-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-3xl my-8 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b dark:border-dark-border flex-shrink-0">
                    <h3 className="text-xl font-bold text-brand-dark dark:text-dark-text-primary">{license ? 'Editar Licença' : 'Nova Licença'}</h3>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Produto</label>
                            {isNewProduct ? (
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newProductName} 
                                        onChange={(e) => setNewProductName(e.target.value)} 
                                        className="flex-1 p-2 border dark:border-dark-border rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-dark-text-primary" 
                                        placeholder="Nome do novo produto"
                                        required
                                    />
                                    <button type="button" onClick={() => setIsNewProduct(false)} className="text-sm text-blue-600 hover:underline">Cancelar</button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <select 
                                        name="produto" 
                                        value={formData.produto} 
                                        onChange={handleChange} 
                                        className="flex-1 p-2 border dark:border-dark-border rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-dark-text-primary"
                                        required
                                    >
                                        <option value="">Selecione um Produto</option>
                                        {productNames.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                    <button type="button" onClick={() => { setIsNewProduct(true); setFormData(prev => ({...prev, produto: ''})); }} className="text-sm text-blue-600 hover:underline whitespace-nowrap">Novo Produto</button>
                                </div>
                            )}
                        </div>

                        <input type="text" name="usuario" placeholder="Usuário (E-mail) *" value={formData.usuario} onChange={handleChange} className="p-2 border dark:border-dark-border rounded-md bg-white dark:bg-gray-800" required />
                        <input type="text" name="chaveSerial" placeholder="Chave/Serial *" value={formData.chaveSerial} onChange={handleChange} className="p-2 border dark:border-dark-border rounded-md bg-white dark:bg-gray-800" required />
                        
                        <input type="text" name="empresa" placeholder="Empresa" value={formData.empresa || ''} onChange={handleChange} className="p-2 border dark:border-dark-border rounded-md bg-white dark:bg-gray-800" />
                        <input type="text" name="cargo" placeholder="Cargo" value={formData.cargo || ''} onChange={handleChange} className="p-2 border dark:border-dark-border rounded-md bg-white dark:bg-gray-800" />
                        
                        <input type="text" name="setor" placeholder="Setor" value={formData.setor || ''} onChange={handleChange} className="p-2 border dark:border-dark-border rounded-md bg-white dark:bg-gray-800" />
                        <input type="text" name="gestor" placeholder="Gestor" value={formData.gestor || ''} onChange={handleChange} className="p-2 border dark:border-dark-border rounded-md bg-white dark:bg-gray-800" />
                        
                        <input type="text" name="centroCusto" placeholder="Centro de Custo" value={formData.centroCusto || ''} onChange={handleChange} className="p-2 border dark:border-dark-border rounded-md bg-white dark:bg-gray-800" />
                        <input type="text" name="contaRazao" placeholder="Conta Razão" value={formData.contaRazao || ''} onChange={handleChange} className="p-2 border dark:border-dark-border rounded-md bg-white dark:bg-gray-800" />
                        
                        <input type="text" name="nomeComputador" placeholder="Nome do Computador" value={formData.nomeComputador || ''} onChange={handleChange} className="p-2 border dark:border-dark-border rounded-md bg-white dark:bg-gray-800" />
                        <input type="text" name="numeroChamado" placeholder="Nº do Chamado da Solicitação" value={formData.numeroChamado || ''} onChange={handleChange} className="p-2 border dark:border-dark-border rounded-md bg-white dark:bg-gray-800" />

                        <div className="sm:col-span-2">
                             <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Data de Vencimento (deixe em branco se for perpétua)</label>
                            <input type="date" name="dataExpiracao" value={formData.dataExpiracao} onChange={handleChange} className="w-full p-2 border dark:border-dark-border rounded-md bg-white dark:bg-gray-800" />
                        </div>

                         <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Observações</label>
                            <textarea 
                                name="observacoes" 
                                value={formData.observacoes || ''} 
                                onChange={handleChange} 
                                rows={3}
                                className="w-full p-2 border dark:border-dark-border rounded-md bg-white dark:bg-gray-800"
                                placeholder="Adicione qualquer informação relevante sobre a solicitação ou a licença..."
                            ></textarea>
                        </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="bg-brand-primary text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400">
                            {isSaving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LicenseControl: React.FC<LicenseControlProps> = ({ currentUser }) => {
    const [licenses, setLicenses] = useState<License[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLicense, setEditingLicense] = useState<License | null>(null);
    const [filter, setFilter] = useState('');
    const [totalLicenses, setTotalLicenses] = useState<Record<string, number>>({});
    const [productNames, setProductNames] = useState<string[]>([]);
    const [isEditingTotals, setIsEditingTotals] = useState(false);

    const loadLicensesAndProducts = async () => {
        setLoading(true);
        try {
            const [licensesData, totalsData] = await Promise.all([
                getLicenses(currentUser),
                getLicenseTotals()
            ]);
            setLicenses(licensesData);
            setTotalLicenses(totalsData);

            // Merge product names from existing licenses and the totals definition
            const namesFromLicenses = new Set(licensesData.map(l => l.produto));
            const namesFromTotals = new Set(Object.keys(totalsData));
            const combinedNames = new Set([...namesFromLicenses, ...namesFromTotals]);
            setProductNames(Array.from(combinedNames).sort());

        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLicensesAndProducts();
    }, [currentUser]);

    const handleOpenModal = (license: License | null = null) => {
        setEditingLicense(license);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingLicense(null);
        setIsModalOpen(false);
    };

    const handleSave = () => {
        loadLicensesAndProducts();
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Tem certeza que deseja excluir esta licença?")) {
            try {
                await deleteLicense(id, currentUser.username);
                loadLicensesAndProducts();
            } catch (error) {
                console.error("Failed to delete license", error);
            }
        }
    };

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
            // Explicit cast to ensure correct typing for map
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

    const handleExportToXlsx = async () => {
        try {
            if (licenses.length === 0) {
                alert("Nenhuma licença para exportar.");
                return;
            }

            // Group licenses by product
            const licensesByProduct: Record<string, License[]> = {};
            // Explicit cast to avoid 'unknown' type error
            (licenses as License[]).forEach(license => {
                if (!licensesByProduct[license.produto]) {
                    licensesByProduct[license.produto] = [];
                }
                licensesByProduct[license.produto].push(license);
            });

            await import('xlsx');
            const XLSX = (window as any).XLSX;

            if (!XLSX || !XLSX.utils || typeof XLSX.utils.json_to_sheet !== 'function') {
                alert("Erro ao carregar biblioteca de exportação.");
                return;
            }

            const wb = XLSX.utils.book_new();

            // Create a sheet for each product
            Object.keys(licensesByProduct).sort().forEach(productName => {
                const productLicenses = licensesByProduct[productName];
                const dataToExport = productLicenses.map(l => ({
                    'Produto': l.produto,
                    'Usuário': l.usuario,
                    'Chave/Serial': l.chaveSerial,
                    'Data Expiração': l.dataExpiracao || 'Perpétua',
                    'Empresa': l.empresa || '',
                    'Cargo': l.cargo || '',
                    'Setor': l.setor || '',
                    'Gestor': l.gestor || '',
                    'Centro de Custo': l.centroCusto || '',
                    'Status': l.approval_status === 'pending_approval' ? 'Pendente' : l.approval_status === 'rejected' ? 'Rejeitado' : 'Aprovado'
                }));

                const ws = XLSX.utils.json_to_sheet(dataToExport);
                // Sheet names limited to 31 chars
                const safeSheetName = productName.substring(0, 31).replace(/[\\/?*[\]]/g, "");
                XLSX.utils.book_append_sheet(wb, ws, safeSheetName || "Licenças");
            });
            
            // Also add a Summary sheet
            const summaryData = Object.keys(totalLicenses).map(prod => {
                const used = licenses.filter(l => l.produto === prod && l.approval_status === 'approved').length;
                const total = totalLicenses[prod] || 0;
                return {
                    'Produto': prod,
                    'Total Adquirido': total,
                    'Em Uso': used,
                    'Disponível': total - used
                };
            });
            const wsSummary = XLSX.utils.json_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo Geral");

            const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' }) as string;
            const dataUri = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
            
            const fileName = `relatorio_licencas_${new Date().toISOString().split('T')[0]}.xlsx`;
            const a = document.createElement('a');
            a.href = dataUri;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

        } catch (error) {
            console.error("Export error:", error);
            alert("Erro ao exportar relatório.");
        }
    };


    const filteredLicenses = useMemo(() => {
        if (!filter) return licenses;
        const lowerFilter = filter.toLowerCase();
        return licenses.filter(l => 
            l.produto.toLowerCase().includes(lowerFilter) ||
            l.usuario.toLowerCase().includes(lowerFilter) ||
            l.chaveSerial.toLowerCase().includes(lowerFilter) ||
            (l.empresa && l.empresa.toLowerCase().includes(lowerFilter))
        );
    }, [licenses, filter]);

    const licensesByProduct = useMemo(() => {
        const grouped: Record<string, License[]> = {};
        // Initialize with all known products (even if no licenses assigned yet) to show 0 count
        productNames.forEach(name => {
            grouped[name] = [];
        });
        
        filteredLicenses.forEach(l => {
            if (!grouped[l.produto]) {
                // Handle case where a license might have a product name not in our list yet (though unlikely with select)
                grouped[l.produto] = [];
            }
            grouped[l.produto].push(l);
        });
        return grouped;
    }, [filteredLicenses, productNames]);

    // Sort products alphabetically
    const sortedProductNames = Object.keys(licensesByProduct).sort();

    const isAdmin = currentUser.role === UserRole.Admin;

    return (
        <div className="bg-white dark:bg-dark-card p-4 sm:p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-brand-dark dark:text-dark-text-primary">Controle de Licenças</h2>
                <div className="flex gap-2">
                    {isAdmin && (
                         <button onClick={() => setIsEditingTotals(!isEditingTotals)} className="bg-brand-secondary text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2">
                            <Icon name="Settings" size={18}/> {isEditingTotals ? 'Fechar Edição' : 'Gerenciar Produtos'}
                        </button>
                    )}
                    {isAdmin && (
                        <button onClick={handleExportToXlsx} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center gap-2">
                            <Icon name="FileDown" size={18}/> Exportar Relatório (Excel)
                        </button>
                    )}
                    <button onClick={() => handleOpenModal()} className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <Icon name="Plus" size={18}/> Nova Licença
                    </button>
                </div>
            </div>

            {isEditingTotals && isAdmin && (
                 <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-bg border dark:border-dark-border rounded-lg animate-fade-in">
                    <h3 className="text-lg font-semibold mb-3 text-brand-dark dark:text-dark-text-primary">Gerenciar Produtos e Totais</h3>
                    <EditTotalsForm 
                        totals={totalLicenses} 
                        productNames={productNames} 
                        onSave={async (newTotals, newNames, renames) => {
                             // We need to handle saving differently now:
                             // 1. Update totals values
                             const result = await saveLicenseTotals(newTotals, currentUser.username);
                             // 2. Handle renames if any
                             await handleSaveProductNames(newNames, renames);
                             
                             if (result.success) setIsEditingTotals(false);
                        }}
                        onCancel={() => setIsEditingTotals(false)} 
                    />
                </div>
            )}

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Buscar por Produto, Usuário, Chave..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full p-3 border dark:border-dark-border rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-dark-text-primary"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Icon name="LoaderCircle" className="animate-spin text-brand-primary" size={48} />
                </div>
            ) : (
                <div className="space-y-8">
                    {sortedProductNames.map(product => {
                        const productLicenses = licensesByProduct[product];
                        const totalForProduct = totalLicenses[product] || 0;
                        const usedCount = productLicenses.filter(l => l.approval_status === 'approved').length;
                        const available = totalForProduct - usedCount;
                        
                        // If filtering, only show products that have matching licenses OR the product name itself matches
                        if (filter && productLicenses.length === 0 && !product.toLowerCase().includes(filter.toLowerCase())) return null;

                        return (
                            <div key={product} className="border dark:border-dark-border rounded-lg overflow-hidden shadow-sm bg-white dark:bg-dark-card">
                                <div className="bg-gray-100 dark:bg-gray-900/50 px-6 py-4 border-b dark:border-dark-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div className="flex items-center gap-3">
                                        <Icon name="Layers" className="text-brand-secondary dark:text-dark-text-secondary" />
                                        <h3 className="text-lg font-bold text-brand-dark dark:text-dark-text-primary">{product}</h3>
                                    </div>
                                    <div className="flex gap-4 text-sm">
                                        <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full dark:text-gray-300">Total: <strong>{totalForProduct}</strong></span>
                                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"><Icon name="Pencil" size={12} className="inline mr-1"/> Usadas: <strong>{usedCount}</strong></span>
                                        <span className={`px-3 py-1 rounded-full border ${available < 0 ? 'bg-red-100 border-red-200 text-red-800 dark:bg-red-900/20 dark:text-red-300' : 'bg-green-100 border-green-200 text-green-800 dark:bg-green-900/20 dark:text-green-300'}`}>
                                            Disponíveis: <strong>{available}</strong>
                                        </span>
                                    </div>
                                </div>
                                
                                {productLicenses.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800">
                                                <tr>
                                                    <th className="px-6 py-3">Usuário</th>
                                                    <th className="px-6 py-3">Empresa</th>
                                                    <th className="px-6 py-3">Chave/Serial</th>
                                                    <th className="px-6 py-3">Expiração</th>
                                                    <th className="px-6 py-3 text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {productLicenses.map(l => (
                                                    <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                            {l.usuario}
                                                            {l.approval_status === 'pending_approval' && <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">Pendente</span>}
                                                            {l.approval_status === 'rejected' && <span className="ml-2 text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">Rejeitado</span>}
                                                        </td>
                                                        <td className="px-6 py-4">{l.empresa || '-'}</td>
                                                        <td className="px-6 py-4 font-mono text-xs">{l.chaveSerial}</td>
                                                        <td className="px-6 py-4">{l.dataExpiracao ? new Date(l.dataExpiracao).toLocaleDateString('pt-BR') : 'Perpétua'}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-3">
                                                                <button onClick={() => handleOpenModal(l)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"><Icon name="Pencil" size={16} /></button>
                                                                <button onClick={() => handleDelete(l.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"><Icon name="Trash2" size={16} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm italic">
                                        Nenhuma licença cadastrada para este produto.
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {isModalOpen && <LicenseFormModal license={editingLicense} onClose={handleCloseModal} onSave={handleSave} currentUser={currentUser} productNames={productNames} />}
        </div>
    );
};

// Helper component for editing totals and product names
const EditTotalsForm: React.FC<{ 
    totals: Record<string, number>; 
    productNames: string[];
    onSave: (newTotals: Record<string, number>, newProductNames: string[], renames: Record<string, string>) => void; 
    onCancel: () => void 
}> = ({ totals, productNames, onSave, onCancel }) => {
    // Map current product list to a local state for editing
    const [localData, setLocalData] = useState<{id: string, name: string, total: number}[]>(() => {
        return productNames.map(name => ({
            id: name, // Use original name as ID to track renames
            name: name,
            total: totals[name] || 0
        }));
    });

    const handleChange = (id: string, field: 'name' | 'total', value: string | number) => {
        setLocalData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleAddNew = () => {
        setLocalData(prev => [...prev, { id: `NEW_${Date.now()}`, name: '', total: 0 }]);
    };

    const handleRemove = (id: string) => {
        setLocalData(prev => prev.filter(item => item.id !== id));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newTotals: Record<string, number> = {};
        const newProductNames: string[] = [];
        const renames: Record<string, string> = {}; // oldName -> newName

        localData.forEach(item => {
            if (item.name.trim()) {
                const finalName = item.name.trim();
                newTotals[finalName] = Number(item.total);
                newProductNames.push(finalName);
                
                // Check for rename (if it's not a new item and name changed)
                if (!item.id.startsWith('NEW_') && item.id !== finalName) {
                    renames[item.id] = finalName;
                }
            }
        });
        onSave(newTotals, newProductNames, renames);
    };

    return (
        <form onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2 font-semibold text-sm text-gray-600 dark:text-gray-400">
                <div className="sm:col-span-2">Nome do Produto</div>
                <div>Quantidade Total</div>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4 pr-2">
                {localData.map(item => (
                    <div key={item.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                        <div className="sm:col-span-2 flex gap-2">
                             <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleChange(item.id, 'name', e.target.value)}
                                className="flex-1 p-2 border dark:border-dark-border rounded-md bg-white dark:bg-gray-800 text-sm"
                                placeholder="Nome do Produto"
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                min="0"
                                value={item.total}
                                onChange={(e) => handleChange(item.id, 'total', parseInt(e.target.value) || 0)}
                                className="w-24 p-2 border dark:border-dark-border rounded-md bg-white dark:bg-gray-800 text-sm"
                            />
                            <button type="button" onClick={() => handleRemove(item.id)} className="text-red-500 hover:bg-red-100 p-2 rounded"><Icon name="Trash2" size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between">
                 <button type="button" onClick={handleAddNew} className="text-sm text-brand-primary hover:underline flex items-center gap-1"><Icon name="Plus" size={14}/> Adicionar Produto</button>
                 <div className="flex gap-2">
                     <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                     <button type="submit" className="px-3 py-1.5 text-sm bg-brand-primary text-white rounded hover:bg-blue-700">Salvar Tudo</button>
                 </div>
            </div>
        </form>
    );
};

export default LicenseControl;
