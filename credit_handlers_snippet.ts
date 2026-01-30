// --- Credits Handlers ---

const handleAddCredit = async (newCredit: Omit<CreditItem, 'id' | 'isPaidThisMonth'>) => {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_URL}/credits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: Math.random().toString(36).substr(2, 9),
                userId: currentUser.id,
                name: newCredit.name,
                amount: newCredit.monthlyPayment,
                dueDate: newCredit.dueDate,
                type: newCredit.type,
                // Banking Fields
                totalLoanAmount: newCredit.totalAmount,
                interestRate: newCredit.interestRate,
                interestType: newCredit.interestType,
                durationMonths: newCredit.totalTenor,
                startDate: newCredit.startDate,
                holdAmount: newCredit.holdAmount,
                adminFee: newCredit.adminFee,
                remainingTenor: newCredit.remainingTenor
            })
        });
        if (res.ok) {
            const saved = await res.json();
            setCredits(prev => [...prev, mapCredit(saved)]);
            addNotification('Tagihan Baru', `Berhasil menambahkan tagihan ${newCredit.name}.`, 'Success');
        }
    } catch (error) {
        console.error('Error adding credit:', error);
    }
};

const handlePayCredit = async (creditId: string, accountId: string) => {
    try {
        const res = await fetch(`${API_URL}/credits/${creditId}/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountId })
        });
        if (res.ok) {
            const updated = await res.json();
            setCredits(prev => prev.map(c => c.id === creditId ? mapCredit(updated) : c));
            // Refresh accounts to reflect deduction
            const accRes = await fetch(`${API_URL}/accounts/${currentUser?.id}`);
            setAccounts((await accRes.json()).map(mapAccount));
            addNotification('Pembayaran Berhasil', 'Tagihan berhasil dibayar.', 'Success');
        }
    } catch (error) {
        console.error('Error paying credit:', error);
    }
};

const handleDeleteCredit = async (creditId: string) => {
    try {
        await fetch(`${API_URL}/credits/${creditId}`, { method: 'DELETE' });
        setCredits(prev => prev.filter(c => c.id !== creditId));
    } catch (error) {
        console.error('Error deleting credit:', error);
    }
};
