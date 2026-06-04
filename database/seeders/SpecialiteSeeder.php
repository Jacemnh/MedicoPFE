<?php

namespace Database\Seeders;

use App\Models\Specialite;
use Illuminate\Database\Seeder;

class SpecialiteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $specialites = [
            ['nom' => 'Allergologie', 'description' => 'Spécialité traitant les allergies'],
            ['nom' => 'Anesthésiologie', 'description' => 'Spécialité dédiée à l\'anesthésie et la réanimation'],
            ['nom' => 'Angiologie', 'description' => 'Médecine des vaisseaux (veines, artères)'],
            ['nom' => 'Cardiologie', 'description' => 'Médecine du cœur et des vaisseaux'],
            ['nom' => 'Chirurgie cardiaque', 'description' => 'Chirurgie du cœur'],
            ['nom' => 'Chirurgie digestive', 'description' => 'Chirurgie de l\'appareil digestif'],
            ['nom' => 'Chirurgie infantile', 'description' => 'Chirurgie pédiatrique'],
            ['nom' => 'Chirurgie maxillo-faciale', 'description' => 'Chirurgie de la face et de la mâchoire'],
            ['nom' => 'Chirurgie orthopédique', 'description' => 'Chirurgie des os et articulations'],
            ['nom' => 'Chirurgie plastique', 'description' => 'Chirurgie réparatrice et esthétique'],
            ['nom' => 'Chirurgie thoracique', 'description' => 'Chirurgie du thorax'],
            ['nom' => 'Chirurgie urologique', 'description' => 'Chirurgie de l\'appareil urinaire'],
            ['nom' => 'Chirurgie vasculaire', 'description' => 'Chirurgie des vaisseaux'],
            ['nom' => 'Dentiste', 'description' => 'Soins et traitements des dents et de la cavité buccale'],
            ['nom' => 'Dermatologie', 'description' => 'Médecine de la peau et des maladies vénériennes'],
            ['nom' => 'Endocrinologie', 'description' => 'Médecine des hormones et du métabolisme'],
            ['nom' => 'Gastro-entérologie', 'description' => 'Médecine de l\'appareil digestif'],
            ['nom' => 'Génétique médicale', 'description' => 'Étude des maladies héréditaires'],
            ['nom' => 'Gériatrie', 'description' => 'Médecine des personnes âgées'],
            ['nom' => 'Gynécologie médicale', 'description' => 'Médecine de la femme'],
            ['nom' => 'Gynécologie-obstétrique', 'description' => 'Suivi de grossesse et accouchement'],
            ['nom' => 'Hématologie', 'description' => 'Médecine du sang'],
            ['nom' => 'Hémostase et transfusion', 'description' => 'Spécialité du sang et de la coagulation'],
            ['nom' => 'Infectiologie', 'description' => 'Médecine des maladies infectieuses'],
            ['nom' => 'Médecine du travail', 'description' => 'Santé au travail'],
            ['nom' => 'Médecine du sport', 'description' => 'Pathologies liées à l\'activité physique'],
            ['nom' => 'Médecine d\'urgence', 'description' => 'Prise en charge des urgences'],
            ['nom' => 'Médecine générale', 'description' => 'Médecine de premier recours'],
            ['nom' => 'Médecine interne', 'description' => 'Pathologies complexes et poly-pathologies'],
            ['nom' => 'Médecine légale', 'description' => 'Expertises médicales et judiciaires'],
            ['nom' => 'Médecine physique', 'description' => 'Rééducation et réadaptation'],
            ['nom' => 'Médecine nucléaire', 'description' => 'Imagerie et thérapie par radio-isotopes'],
            ['nom' => 'Médecine vasculaire', 'description' => 'Pathologies des vaisseaux'],
            ['nom' => 'Néphrologie', 'description' => 'Médecine des reins'],
            ['nom' => 'Neurochirurgie', 'description' => 'Chirurgie du système nerveux'],
            ['nom' => 'Neurologie', 'description' => 'Médecine du système nerveux'],
            ['nom' => 'Oncologie', 'description' => 'Traitement des cancers'],
            ['nom' => 'Ophtalmologie', 'description' => 'Médecine des yeux'],
            ['nom' => 'ORL', 'description' => 'Oto-rhino-laryngologie (oreille, nez, gorge)'],
            ['nom' => 'Pédiatrie', 'description' => 'Médecine des enfants'],
            ['nom' => 'Pharmacologie', 'description' => 'Étude des médicaments'],
            ['nom' => 'Pneumologie', 'description' => 'Médecine des poumons'],
            ['nom' => 'Psychiatrie', 'description' => 'Médecine des troubles mentaux'],
            ['nom' => 'Radiologie', 'description' => 'Imagerie médicale'],
            ['nom' => 'Radiothérapie', 'description' => 'Traitement des tumeurs par rayons'],
            ['nom' => 'Réanimation médicale', 'description' => 'Prise en charge des défaillances vitales'],
            ['nom' => 'Rhumatologie', 'description' => 'Médecine des articulations et du squelette'],
            ['nom' => 'Santé publique', 'description' => 'Hygiène et organisation des soins'],
            ['nom' => 'Stomatologie', 'description' => 'Médecine de la bouche et des dents'],
            ['nom' => 'Urologie', 'description' => 'Médecine de l\'appareil urinaire'],

            // Paramedical et Pharmacie
            ['nom' => 'Pharmacien', 'description' => 'Professionnel des médicaments et produits de santé'],
            ['nom' => 'Infirmier', 'description' => 'Soins infirmiers et assistance médicale'],
            ['nom' => 'Kinésithérapie', 'description' => 'Rééducation par le mouvement et massages'],
            ['nom' => 'Ostéopathie', 'description' => 'Thérapie manuelle pour troubles fonctionnels'],
            ['nom' => 'Psychologie', 'description' => 'Accompagnement psychologique et psychothérapie'],
            ['nom' => 'Sage-femme', 'description' => 'Accompagnement de la grossesse, accouchement et suivi gynécologique'],
            ['nom' => 'Orthophonie', 'description' => 'Traitement des troubles de la communication et du langage'],
            ['nom' => 'Podologie/Pédicurie', 'description' => 'Santé du pied et affections unguéales'],
            ['nom' => 'Diététique', 'description' => 'Conseil nutritionnel et équilibre alimentaire'],
            ['nom' => 'Ergothérapie', 'description' => 'Réadaptation par l\'activité pour personnes handicapées'],
            ['nom' => 'Orthoptie', 'description' => 'Dépistage et rééducation des troubles de la vision binoculaire'],
            ['nom' => 'Psychomotricité', 'description' => 'Lien entre fonctions motrices et psychisme'],
            ['nom' => 'Audioprothésiste', 'description' => 'Appareillage et correction de l\'audition'],
            ['nom' => 'Orthopédiste-orthésiste', 'description' => 'Conception d\'appareillages orthopédiques sur mesure'],
            ['nom' => 'Opticien-lunetier', 'description' => 'Vente et adaptation de lunettes et lentilles'],
            ['nom' => 'Puéricultrice', 'description' => 'Soins infirmiers spécialisés pour les nouveau-nés et enfants'],
            ['nom' => 'Aide-soignant', 'description' => 'Assistance aux soins d\'hygiène et de confort'],
            ['nom' => 'Ambulancier', 'description' => 'Transport sanitaire et premiers secours'],
            ['nom' => 'Technicien de laboratoire', 'description' => 'Réalisation d\'analyses médicales'],
            ['nom' => 'Manipulateur radio', 'description' => 'Réalisation d\'actes d\'imagerie médicale'],

            // Biologie et Recherche
            ['nom' => 'Biologie médicale', 'description' => 'Analyses médicales et diagnostic biologique'],
            ['nom' => 'Anatomie pathologique', 'description' => 'Diagnostic par étude des tissus'],
            ['nom' => 'Toxicologie', 'description' => 'Étude des toxiques et poisons'],
            ['nom' => 'Virologie', 'description' => 'Étude et dagnostic des infections virales'],
            ['nom' => 'Parasitologie', 'description' => 'Étude des parasites'],
            ['nom' => 'Immunologie', 'description' => 'Étude du système immunitaire'],

            // Autres spécialités transversales
            ['nom' => 'Addictologie', 'description' => 'Prise en charge des dépendances'],
            ['nom' => 'Algologie', 'description' => 'Gestion de la douleur chronique'],
            ['nom' => 'Andrologie', 'description' => 'Santé masculine et appareil reproducteur'],
            ['nom' => 'Soins palliatifs', 'description' => 'Accompagnement de fin de vie et soulagement'],
            ['nom' => 'Médecine d\'expertise', 'description' => 'Expertises médicales pour assurances ou justice'],
            ['nom' => 'Phlébologie', 'description' => 'Traitement des maladies des veines'],
        ];

        foreach ($specialites as $spec) {
            Specialite::updateOrCreate(
                ['nom' => $spec['nom']],
                ['description' => $spec['description']]
            );
        }
    }
}
