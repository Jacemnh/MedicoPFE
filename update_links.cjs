const fs = require('fs');
const glob = require('glob'); // Note: we might not have glob, but we can just hardcode the 6 files

const files = [
  "c:\\xampp\\htdocs\\mon-projet\\mon-projet-react\\src\\pages\\patient\\DashboardPatient.jsx",
  "c:\\xampp\\htdocs\\mon-projet\\mon-projet-react\\src\\pages\\patient\\RendezVous\\MesRendezVous.jsx",
  "c:\\xampp\\htdocs\\mon-projet\\mon-projet-react\\src\\pages\\patient\\RendezVous\\PrendreRendezVous.jsx",
  "c:\\xampp\\htdocs\\mon-projet\\mon-projet-react\\src\\pages\\patient\\DossierMedical\\DossierMedical.jsx",
  "c:\\xampp\\htdocs\\mon-projet\\mon-projet-react\\src\\pages\\patient\\Paiement\\Paiement.jsx",
  "c:\\xampp\\htdocs\\mon-projet\\mon-projet-react\\src\\pages\\patient\\Profil\\PatientProfil.jsx"
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('Diagnostic IA')) {
    content = content.replace(
      /{ path: '\/patient\/dossier-medical', label: 'Dossier médical', icon: <FileText size={20} \/> },/g,
      "{ path: '/patient/dossier-medical', label: 'Dossier médical', icon: <FileText size={20} /> },\n    { path: '/patient/diagnostic-ia', label: 'Diagnostic IA', icon: <Heart size={20} /> },"
    );
    // Also need to import Heart if it's not imported
    if (content.includes('import {') && content.includes('lucide-react') && !content.includes('Heart')) {
       // A bit tricky, let's just make sure we add it
       content = content.replace(/import\s*\{([^}]+)\}\s*from\s*'lucide-react'/g, (match, p1) => {
         if (!p1.includes('Heart')) {
           return `import { Heart, ${p1} } from 'lucide-react'`;
         }
         return match;
       });
    } else if (content.includes('lucide-react') && content.includes('Heart')) {
       // it's already there
    } else {
       // Just append it
       content = content.replace(/import \{([^}]+)\} from 'lucide-react';/, "import { Heart, $1 } from 'lucide-react';");
    }
    fs.writeFileSync(file, content);
  }
});
console.log("Done");
