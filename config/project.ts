import { ProjectConfig } from '../lib/types';

export const PROJECT_CONFIG: ProjectConfig = {
    clientId: 'youtube_prospect_engine',
    clientName: 'ProspectEngine - YouTube',
    primaryColor: 'hsl(210, 100%, 50%)',
    targets: {
        icp: 'Creadores de contenido y decision makers en empresas con canal de YouTube',
        locations: ['España'],
    },
    enabledPlatforms: ['linkedin'],
    searchSettings: {
        defaultDepth: 10,
        defaultMode: 'fast'
    },
    apexEngineConfig: {
        targetIndustries: [],
        companySizes: ['1-10', '11-50', '51-200'],
        requiredTitles: [
            'CEO', 'Fundador', 'Socio', 'COO', 'Owner',
            'Propietario', 'Director General', 'Gerente', 'Managing Director'
        ],
        excludeTitles: [
            'Agente', 'Asesor', 'Comercial', 'Consultor', 'Franquiciado'
        ],
        dailyContactLimit: 25,
        enableNPLDetection: true,
        batchScrapingStrategy: 'provincial'
    }
};
