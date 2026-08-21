import re

with open('src/components/Pages/AnalisaOperatorPage.tsx', 'r') as f:
    code = f.read()

# For Rendemen Utama
code = code.replace(
    'const head1 = ["Mesin", ...datesHeaders, "Akumulasi", "Target Fix", "% Performance", "Ket Orange", "Ket Hijau"];',
    'const head1 = ["Mesin", ...(selectedWeek === \\'all\\' ? [] : datesHeaders), "Akumulasi", "Target Fix", "% Performance", "Ket Orange", "Ket Hijau"];'
)
code = code.replace(
    '...row.dayCells.map(c => (c.yieldUtama * 100).toFixed(2) + \\'%\\'),',
    '...((selectedWeek === \\'all\\') ? [] : row.dayCells.map(c => (c.yieldUtama * 100).toFixed(2) + \\'%\\')),'
)

# For Rendemen Turunan
code = code.replace(
    'const head2 = ["Mesin", ...datesHeaders, "Akumulasi"];',
    'const head2 = ["Mesin", ...(selectedWeek === \\'all\\' ? [] : datesHeaders), "Akumulasi"];'
)
code = code.replace(
    '...row.dayCells.map(c => (c.yieldTurunan * 100).toFixed(2) + \\'%\\'),',
    '...((selectedWeek === \\'all\\') ? [] : row.dayCells.map(c => (c.yieldTurunan * 100).toFixed(2) + \\'%\\')),'
)

# For Rendemen Total
code = code.replace(
    'const head3 = ["Mesin", ...datesHeaders, "Akumulasi", "Target Fix", "% Performance", "Ket Orange", "Ket Hijau"];',
    'const head3 = ["Mesin", ...(selectedWeek === \\'all\\' ? [] : datesHeaders), "Akumulasi", "Target Fix", "% Performance", "Ket Orange", "Ket Hijau"];'
)
code = code.replace(
    '...row.dayCells.map(c => (c.yieldTotal * 100).toFixed(2) + \\'%\\'),',
    '...((selectedWeek === \\'all\\') ? [] : row.dayCells.map(c => (c.yieldTotal * 100).toFixed(2) + \\'%\\')),'
)

with open('src/components/Pages/AnalisaOperatorPage.tsx', 'w') as f:
    f.write(code)

print("Patched PDF logic!")
