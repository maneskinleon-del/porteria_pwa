import fs from 'fs';

['dist'].forEach(p => {
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
  }
});
