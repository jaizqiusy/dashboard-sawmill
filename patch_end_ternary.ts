import fs from 'fs';

const path = 'src/components/Pages/AnalisaOperatorPage.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  '              )}
            </div>
          </div>
        )}

        {/* Dedicated Section: Riwayat & Galeri Foto Catatan Analisa Operator */}',
  `              )}
            </div>
          </div>
        ) : null}

        {/* Dedicated Section: Riwayat & Galeri Foto Catatan Analisa Operator */}`
);

fs.writeFileSync(path, code);
