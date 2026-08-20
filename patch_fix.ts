import fs from 'fs';

const path = 'src/components/Pages/AnalisaOperatorPage.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetStr = `                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        ) : viewMode === 'detail' ? (`;

const replaceStr = `                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : viewMode === 'detail' ? (`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync(path, code);
