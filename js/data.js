/**
 * @license
 * FUTMANAGER Mobile - js/data.js
 * Base de dados inicial de Ligas, Clubes, Nacionalidades e Sistema de Jogadores
 */

import { EXPANDED_NATIONALITIES, EXPANDED_LEAGUES, EXPANDED_CLUBS } from './leagues_data.js';

export const NATIONALITIES = EXPANDED_NATIONALITIES;

export const INITIAL_LEAGUES = EXPANDED_LEAGUES;

export const INITIAL_CLUBS = EXPANDED_CLUBS;


/**
 * Retorna os clubes filtrados por liga
 * @param {string} leagueId 
 * @returns {Array}
 */
export function getClubsByLeague(leagueId) {
  return INITIAL_CLUBS.filter(club => club.leagueId === leagueId);
}

/**
 * Retorna uma liga pelo ID
 * @param {string} leagueId 
 * @returns {Object|null}
 */
export function getLeagueById(leagueId) {
  return INITIAL_LEAGUES.find(league => league.id === leagueId) || null;
}

/**
 * Retorna um clube pelo ID
 * @param {string} clubId 
 * @returns {Object|null}
 */
export function getClubById(clubId) {
  return INITIAL_CLUBS.find(club => club.id === clubId) || null;
}

/**
 * Formata valores monetários com precisão
 * @param {number} value 
 * @param {string} currencySymbol 
 * @returns {string}
 */
export function formatMoney(value, currencySymbol = 'R$') {
  if (value >= 1000000) {
    const millions = (value / 1000000).toFixed(1);
    return `${currencySymbol} ${millions.replace('.0', '')}M`;
  }
  if (value >= 1000) {
    const thousands = (value / 1000).toFixed(0);
    return `${currencySymbol} ${thousands}K`;
  }
  return `${currencySymbol} ${value.toLocaleString('pt-BR')}`;
}

/* ==========================================================================
   SISTEMA DE JOGADORES (ETAPA 2)
   ========================================================================== */

/**
 * Calcula a força geral individual de acordo com atributos e posição
 * @param {{ attack: number, defense: number, pass: number, physical: number, position: 'GOL'|'DEF'|'MEI'|'ATA' }} player
 * @returns {number}
 */
export function calculatePlayerOverall(player) {
  const { attack, defense, pass, physical, position } = player;

  let ovr = 50;
  switch (position) {
    case 'GOL':
      // Goleiro valoriza fortemente defesa (reflexos/posicionamento) e físico
      ovr = (defense * 0.65) + (physical * 0.25) + (pass * 0.10);
      break;
    case 'DEF':
      // Defensor valoriza desarme, posicionamento e vigor físico
      ovr = (defense * 0.55) + (physical * 0.25) + (pass * 0.15) + (attack * 0.05);
      break;
    case 'MEI':
      // Meio-campista valoriza passe, visão, apoio ao ataque e recomposição
      ovr = (pass * 0.35) + (attack * 0.25) + (defense * 0.20) + (physical * 0.20);
      break;
    case 'ATA':
      // Atacante valoriza finalização/ataque, explosão física e passes
      ovr = (attack * 0.55) + (physical * 0.20) + (pass * 0.15) + (defense * 0.10);
      break;
    default:
      ovr = (attack + defense + pass + physical) / 4;
  }

  return Math.min(99, Math.max(1, Math.round(ovr)));
}

/**
 * Calcula a força geral do elenco com base nos 11 titulares ou média ponderada
 * @param {Array} squad 
 * @param {Array} lineup 
 * @returns {number}
 */
export function calculateSquadOverall(squad, lineup = []) {
  if (!squad || squad.length === 0) return 70;

  // Se houver escalação definida com jogadores escalados
  if (lineup && lineup.length > 0) {
    const starterIds = lineup.map(slot => slot.playerId).filter(Boolean);
    const starters = squad.filter(p => starterIds.includes(p.id));

    if (starters.length >= 7) {
      const sumStarters = starters.reduce((acc, p) => acc + p.overall, 0);
      return Math.round(sumStarters / starters.length);
    }
  }

  // Fallback: média dos 14 melhores jogadores
  const sorted = [...squad].sort((a, b) => b.overall - a.overall);
  const topPlayers = sorted.slice(0, 14);
  const sum = topPlayers.reduce((acc, p) => acc + p.overall, 0);
  return Math.round(sum / topPlayers.length);
}

/**
 * Nomes e sobrenomes autênticos para geração determinística por região
 */
export const ROSTER_NAMES = {
  BR: {
    first: ['Gabriel', 'Lucas', 'Rodrigo', 'Matheus', 'Vinicius', 'Bruno', 'Felipe', 'Eduardo', 'Thiago', 'Gustavo', 'Danilo', 'Rafael', 'Luan', 'Murilo', 'Everton', 'Marcos', 'Kaio', 'André', 'Igor', 'Pedro', 'Rayan', 'Estêvão', 'Endrick', 'Breno', 'Arthur'],
    last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Ramos', 'Teixeira', 'Cardoso', 'Araújo', 'Melo']
  },
  EN: {
    first: ['Harry', 'Jack', 'Declan', 'Marcus', 'Phil', 'Jude', 'Bukayo', 'Cole', 'John', 'Kyle', 'James', 'Trent', 'Luke', 'Jordan', 'Oliver', 'Harvey', 'Mason', 'Conor', 'Lewis', 'Ben', 'Edward', 'George', 'William', 'Alfie', 'Sam'],
    last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'White', 'Harris', 'Clark', 'Walker', 'Young', 'Wright', 'Baker', 'Green', 'Evans', 'King', 'Cooper']
  },
  ES: {
    first: ['Alejandro', 'Pablo', 'Pedri', 'Gavi', 'Lamine', 'Ferran', 'Dani', 'Mikel', 'Rodri', 'Alvaro', 'Nico', 'Unai', 'David', 'Sergio', 'Inigo', 'Marc', 'Pau', 'Alex', 'Jesus', 'Gerard', 'Hugo', 'Borja', 'Adrian', 'Yeremy', 'Brais'],
    last: ['Garcia', 'Martinez', 'Lopez', 'Sanchez', 'Gonzalez', 'Rodriguez', 'Fernandez', 'Perez', 'Gomez', 'Martin', 'Ruiz', 'Diaz', 'Navarro', 'Torres', 'Ramos', 'Vazquez', 'Castro', 'Romero', 'Morata', 'Iglesias', 'Mendez', 'Herrera', 'Alvarez', 'Suarez', 'Moreno']
  },
  DE: {
    first: ['Florian', 'Jamal', 'Joshua', 'Kai', 'Leroy', 'Leon', 'Toni', 'Thomas', 'Manuel', 'Marc', 'Nico', 'Antonio', 'Maximilian', 'Julian', 'Robin', 'Jonas', 'Pascal', 'Deniz', 'Waldemar', 'Kevin', 'Lukas', 'Felix', 'Niklas', 'David', 'Lars'],
    last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hofmann', 'Hartmann', 'Lange']
  },
  IT: {
    first: ['Federico', 'Nicolo', 'Alessandro', 'Gianluigi', 'Lorenzo', 'Davide', 'Giacomo', 'Matteo', 'Manuel', 'Francesco', 'Riccardo', 'Bryan', 'Gianluca', 'Ciro', 'Stephan', 'Samuele', 'Giorgio', 'Andrea', 'Marco', 'Leonardo', 'Mattia', 'Edoardo', 'Pietro', 'Domenico', 'Simone'],
    last: ['Rossi', 'Ferrari', 'Russo', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso']
  },
  FR: {
    first: ['Kylian', 'Antoine', 'Aurélien', 'Eduardo', 'Ousmane', 'Kingsley', 'Marcus', 'Dayot', 'William', 'Jules', 'Théo', 'Mike', 'Randal', 'Bradley', 'Warren', 'Youssouf', 'Moussa', 'Adrien', 'Lucas', 'Benjamin', 'Jonathan', 'Tanguy', 'Rayan', 'Christopher', 'Enzo'],
    last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'Andre', 'Mercier', 'Dupont']
  },
  PT: {
    first: ['Bernardo', 'Bruno', 'Diogo', 'Rafael', 'Ruben', 'Joao', 'Goncalo', 'Vitinha', 'Pedro', 'Nuno', 'Cristiano', 'Antonio', 'Danilo', 'Matheus', 'Francisco', 'Otavio', 'Palhinha', 'Rui', 'Jose', 'Renato', 'Tiago', 'Fabio', 'Andre', 'Tomas', 'Ricardo'],
    last: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Jesus', 'Sousa', 'Fernandes', 'Goncalves', 'Gomes', 'Lopes', 'Marques', 'Alves', 'Ribeiro', 'Pinto', 'Carvalho', 'Teixeira', 'Moreira', 'Correia', 'Mendes', 'Nunes', 'Vieira']
  },
  AR: {
    first: ['Lionel', 'Julian', 'Lautaro', 'Rodrigo', 'Enzo', 'Alexis', 'Emiliano', 'Cristian', 'Nahuel', 'Nicolas', 'Leandro', 'Giovani', 'Alejandro', 'Thiago', 'Valentin', 'Facundo', 'Esequiel', 'Franco', 'Lucas', 'Marcos', 'Mateo', 'Agustin', 'Tomas', 'Santiago', 'Ignacio'],
    last: ['Messi', 'Alvarez', 'Martinez', 'De Paul', 'Fernandez', 'Mac Allister', 'Romero', 'Molina', 'Otamendi', 'Tagliafico', 'Paredes', 'Lo Celso', 'Garnacho', 'Almada', 'Barco', 'Carboni', 'Palacios', 'Armani', 'Acuna', 'Montiel', 'Correa', 'Dybala', 'Gonzalez', 'Simeone', 'Buendia']
  },
  UY: {
    first: ['Federico', 'Darwin', 'Ronald', 'Manuel', 'Rodrigo', 'Nicolas', 'Facundo', 'Mathias', 'Sebastian', 'Giorgian', 'Nahitan', 'Sergio', 'Guillermo', 'Lucas', 'Brian', 'Maxi', 'Emiliano', 'Matias', 'Agustin', 'Diego', 'Luciano', 'Santiago', 'Ignacio', 'Gaston', 'Felipe'],
    last: ['Valverde', 'Nunez', 'Araujo', 'Ugarte', 'Bentancur', 'De la Cruz', 'Pellistri', 'Olivera', 'Caceres', 'Arrascaeta', 'Nandez', 'Rochet', 'Varela', 'Torreira', 'Rodriguez', 'Gomez', 'Martinez', 'Vina', 'Canobbio', 'Suarez', 'Cavani', 'Godin', 'Gimenez', 'Coates', 'Vecino']
  },
  CL: {
    first: ['Arturo', 'Alexis', 'Gary', 'Claudio', 'Ben', 'Erick', 'Marcelino', 'Victor', 'Paulo', 'Gabriel', 'Brayan', 'Alexander', 'Diego', 'Dario', 'Gonzalo', 'Felipe', 'Cesar', 'Carlos', 'Vicente', 'Ignacio', 'Lucas', 'Maximiliano', 'Matias', 'Tomas', 'Cristian'],
    last: ['Vidal', 'Sanchez', 'Medel', 'Bravo', 'Brereton', 'Pulgar', 'Nunez', 'Davila', 'Diaz', 'Suazo', 'Cortes', 'Aravena', 'Valdes', 'Osorio', 'Tapia', 'Loyola', 'Perez', 'Palacios', 'Pizarro', 'Catalan', 'Kuscevic', 'Echeverria', 'Sierralta', 'Aranguiz', 'Isla']
  },
  CO: {
    first: ['Luis', 'James', 'Jhon', 'Jefferson', 'Richard', 'Daniel', 'Camilo', 'Davinson', 'Carlos', 'Mateus', 'Yerry', 'Kevin', 'Jorge', 'Jhonatan', 'Santiago', 'Juan', 'Rafael', 'David', 'Yaser', 'Gustavo', 'Johan', 'Cristian', 'Alvaro', 'Deiver', 'Nelson'],
    last: ['Diaz', 'Rodriguez', 'Arias', 'Lerma', 'Rios', 'Munoz', 'Vargas', 'Sanchez', 'Cuesta', 'Uribe', 'Mina', 'Castano', 'Carrascal', 'Cordoba', 'Borre', 'Quintero', 'Sinisterra', 'Ospina', 'Asprilla', 'Puerta', 'Mojica', 'Lucumi', 'Montero', 'Machado', 'Palacios']
  },
  PY: {
    first: ['Julio', 'Miguel', 'Gustavo', 'Mathias', 'Diego', 'Ramon', 'Alejandro', 'Junior', 'Omar', 'Fabian', 'Roberto', 'Carlos', 'Damian', 'Adam', 'Alex', 'Angel', 'Derlis', 'Richard', 'Braian', 'Matias', 'Antonio', 'Lucas', 'Ivan', 'Hernan', 'Hugo'],
    last: ['Enciso', 'Almiron', 'Gomez', 'Villasanti', 'Gomez', 'Sosa', 'Gamarra', 'Alonso', 'Alderete', 'Balbuena', 'Fernandez', 'Coronel', 'Bobadilla', 'Bareiro', 'Arce', 'Romero', 'Gonzalez', 'Sanchez', 'Ojeda', 'Rojas', 'Sanabria', 'Cardozo', 'Cabañas', 'Da Silva', 'Villar']
  },
  EC: {
    first: ['Moises', 'Piero', 'Enner', 'Felix', 'Willian', 'Kendry', 'Angelo', 'Alan', 'Hernan', 'Carlos', 'John', 'Jeremy', 'Jhoanner', 'Kevin', 'Jose', 'Jordy', 'Pedro', 'Alexander', 'Gonzalo', 'Jhegson', 'Leonardo', 'Bryan', 'Nilson', 'Pervis', 'Romario'],
    last: ['Caicedo', 'Hincapie', 'Valencia', 'Torres', 'Pacho', 'Paez', 'Preciado', 'Franco', 'Galindez', 'Gruezo', 'Yeboah', 'Sarmiento', 'Chavez', 'Rodriguez', 'Cifuentes', 'Caicedo', 'Ortiz', 'Dominguez', 'Plata', 'Mendez', 'Campana', 'Ramirez', 'Angulo', 'Estupinan', 'Ibarra']
  },
  PE: {
    first: ['Paolo', 'Pedro', 'Renato', 'Piero', 'Bryan', 'Gianluca', 'Luis', 'Edison', 'Alexander', 'Carlos', 'Marcos', 'Sergio', 'Wilder', 'Andy', 'Oliver', 'Jesus', 'Joao', 'Jairo', 'Erick', 'Aldo', 'Franco', 'Miguel', 'Christofer', 'Christian', 'Anderson'],
    last: ['Guerrero', 'Gallese', 'Tapia', 'Quispe', 'Reyna', 'Lapadula', 'Advincula', 'Flores', 'Callens', 'Zambrano', 'Lopez', 'Pena', 'Cartagena', 'Polo', 'Sonne', 'Castillo', 'Grimaldo', 'Concha', 'Noriega', 'Corzo', 'Navarro', 'Trauco', 'Gonzales', 'Cueva', 'Santamaria']
  }
};

/**
 * Jogadores reais e icônicos pré-definidos para os principais clubes
 */
const PRESET_STARS = {
  fla: [
    { name: 'Agustín Rossi', pos: 'GOL', age: 29, atk: 25, def: 84, pas: 68, phy: 80 },
    { name: 'Léo Ortiz', pos: 'DEF', age: 28, atk: 45, def: 83, pas: 78, phy: 82 },
    { name: 'Léo Pereira', pos: 'DEF', age: 28, atk: 40, def: 82, pas: 74, phy: 81 },
    { name: 'Ayrton Lucas', pos: 'DEF', age: 27, atk: 72, def: 77, pas: 75, phy: 86 },
    { name: 'Guillermo Varela', pos: 'DEF', age: 31, atk: 68, def: 78, pas: 74, phy: 79 },
    { name: 'Erick Pulgar', pos: 'MEI', age: 31, atk: 65, def: 82, pas: 84, phy: 82 },
    { name: 'Nicolás De La Cruz', pos: 'MEI', age: 27, atk: 81, def: 75, pas: 86, phy: 84 },
    { name: 'Gerson', pos: 'MEI', age: 27, atk: 82, def: 78, pas: 87, phy: 85 },
    { name: 'Giorgian De Arrascaeta', pos: 'MEI', age: 30, atk: 86, def: 55, pas: 90, phy: 76 },
    { name: 'Pedro', pos: 'ATA', age: 27, atk: 87, def: 35, pas: 75, phy: 83 },
    { name: 'Bruno Henrique', pos: 'ATA', age: 33, atk: 83, def: 42, pas: 73, phy: 86 },
    { name: 'Luiz Araújo', pos: 'ATA', age: 28, atk: 80, def: 48, pas: 78, phy: 84 }
  ],
  pal: [
    { name: 'Weverton', pos: 'GOL', age: 36, atk: 20, def: 84, pas: 72, phy: 78 },
    { name: 'Gustavo Gómez', pos: 'DEF', age: 31, atk: 52, def: 86, pas: 74, phy: 85 },
    { name: 'Murilo', pos: 'DEF', age: 27, atk: 48, def: 83, pas: 72, phy: 83 },
    { name: 'Joaquín Piquerez', pos: 'DEF', age: 26, atk: 74, def: 80, pas: 78, phy: 84 },
    { name: 'Marcos Rocha', pos: 'DEF', age: 35, atk: 66, def: 77, pas: 76, phy: 74 },
    { name: 'Aníbal Moreno', pos: 'MEI', age: 25, atk: 62, def: 83, pas: 81, phy: 84 },
    { name: 'Zé Rafael', pos: 'MEI', age: 31, atk: 72, def: 79, pas: 80, phy: 82 },
    { name: 'Raphael Veiga', pos: 'MEI', age: 29, atk: 85, def: 60, pas: 87, phy: 81 },
    { name: 'Maurício', pos: 'MEI', age: 23, atk: 80, def: 58, pas: 82, phy: 78 },
    { name: 'Estêvão', pos: 'ATA', age: 18, atk: 84, def: 40, pas: 81, phy: 79 },
    { name: 'Rony', pos: 'ATA', age: 29, atk: 78, def: 60, pas: 70, phy: 88 },
    { name: 'Flaco López', pos: 'ATA', age: 23, atk: 82, def: 35, pas: 72, phy: 84 }
  ],
  mancity: [
    { name: 'Ederson', pos: 'GOL', age: 31, atk: 30, def: 87, pas: 88, phy: 82 },
    { name: 'Rúben Dias', pos: 'DEF', age: 27, atk: 45, def: 89, pas: 80, phy: 88 },
    { name: 'Manuel Akanji', pos: 'DEF', age: 29, atk: 50, def: 85, pas: 82, phy: 86 },
    { name: 'Josko Gvardiol', pos: 'DEF', age: 23, atk: 70, def: 86, pas: 84, phy: 87 },
    { name: 'Kyle Walker', pos: 'DEF', age: 34, atk: 68, def: 84, pas: 78, phy: 88 },
    { name: 'Rodri', pos: 'MEI', age: 28, atk: 82, def: 91, pas: 92, phy: 89 },
    { name: 'Kevin De Bruyne', pos: 'MEI', age: 33, atk: 88, def: 65, pas: 95, phy: 78 },
    { name: 'Bernardo Silva', pos: 'MEI', age: 30, atk: 85, def: 70, pas: 90, phy: 82 },
    { name: 'Phil Foden', pos: 'MEI', age: 24, atk: 88, def: 58, pas: 89, phy: 84 },
    { name: 'Erling Haaland', pos: 'ATA', age: 24, atk: 94, def: 42, pas: 74, phy: 93 },
    { name: 'Jérémy Doku', pos: 'ATA', age: 22, atk: 84, def: 40, pas: 80, phy: 90 },
    { name: 'Jack Grealish', pos: 'ATA', age: 29, atk: 82, def: 52, pas: 85, phy: 80 }
  ],
  realmadrid: [
    { name: 'Thibaut Courtois', pos: 'GOL', age: 32, atk: 20, def: 90, pas: 75, phy: 85 },
    { name: 'Antonio Rüdiger', pos: 'DEF', age: 31, atk: 52, def: 88, pas: 75, phy: 90 },
    { name: 'Éder Militão', pos: 'DEF', age: 26, atk: 50, def: 87, pas: 76, phy: 88 },
    { name: 'Ferland Mendy', pos: 'DEF', age: 29, atk: 65, def: 84, pas: 76, phy: 87 },
    { name: 'Dani Carvajal', pos: 'DEF', age: 32, atk: 74, def: 86, pas: 82, phy: 84 },
    { name: 'Federico Valverde', pos: 'MEI', age: 26, atk: 84, def: 83, pas: 87, phy: 91 },
    { name: 'Aurélien Tchouaméni', pos: 'MEI', age: 24, atk: 72, def: 87, pas: 84, phy: 88 },
    { name: 'Jude Bellingham', pos: 'MEI', age: 21, atk: 89, def: 78, pas: 88, phy: 88 },
    { name: 'Luka Modric', pos: 'MEI', age: 39, atk: 78, def: 68, pas: 92, phy: 70 },
    { name: 'Vinícius Júnior', pos: 'ATA', age: 24, atk: 92, def: 40, pas: 85, phy: 91 },
    { name: 'Kylian Mbappé', pos: 'ATA', age: 25, atk: 94, def: 38, pas: 84, phy: 92 },
    { name: 'Rodrygo', pos: 'ATA', age: 23, atk: 88, def: 45, pas: 84, phy: 86 }
  ],
  barcelona: [
    { name: 'Marc-André ter Stegen', pos: 'GOL', age: 32, atk: 25, def: 87, pas: 86, phy: 80 },
    { name: 'Ronald Araújo', pos: 'DEF', age: 25, atk: 48, def: 88, pas: 70, phy: 89 },
    { name: 'Pau Cubarsí', pos: 'DEF', age: 18, atk: 42, def: 83, pas: 85, phy: 78 },
    { name: 'Alejandro Balde', pos: 'DEF', age: 21, atk: 76, def: 78, pas: 78, phy: 89 },
    { name: 'Jules Koundé', pos: 'DEF', age: 26, atk: 65, def: 85, pas: 80, phy: 84 },
    { name: 'Pedri', pos: 'MEI', age: 22, atk: 82, def: 70, pas: 90, phy: 78 },
    { name: 'Gavi', pos: 'MEI', age: 20, atk: 78, def: 79, pas: 83, phy: 86 },
    { name: 'Frenkie de Jong', pos: 'MEI', age: 27, atk: 79, def: 79, pas: 88, phy: 83 },
    { name: 'Dani Olmo', pos: 'MEI', age: 26, atk: 85, def: 55, pas: 86, phy: 80 },
    { name: 'Lamine Yamal', pos: 'ATA', age: 17, atk: 89, def: 42, pas: 87, phy: 82 },
    { name: 'Robert Lewandowski', pos: 'ATA', age: 36, atk: 90, def: 35, pas: 78, phy: 82 },
    { name: 'Raphinha', pos: 'ATA', age: 28, atk: 86, def: 60, pas: 84, phy: 87 }
  ],
  bayern: [
    { name: 'Manuel Neuer', pos: 'GOL', age: 38, atk: 20, def: 87, pas: 82, phy: 78 },
    { name: 'Dayot Upamecano', pos: 'DEF', age: 26, atk: 45, def: 85, pas: 78, phy: 87 },
    { name: 'Kim Min-jae', pos: 'DEF', age: 28, atk: 40, def: 86, pas: 74, phy: 88 },
    { name: 'Alphonso Davies', pos: 'DEF', age: 24, atk: 78, def: 80, pas: 80, phy: 93 },
    { name: 'Joshua Kimmich', pos: 'MEI', age: 29, atk: 78, def: 84, pas: 91, phy: 84 },
    { name: 'Leon Goretzka', pos: 'MEI', age: 29, atk: 80, def: 81, pas: 82, phy: 88 },
    { name: 'Jamal Musiala', pos: 'MEI', age: 21, atk: 90, def: 55, pas: 88, phy: 82 },
    { name: 'Leroy Sané', pos: 'ATA', age: 28, atk: 86, def: 42, pas: 83, phy: 89 },
    { name: 'Serge Gnabry', pos: 'ATA', age: 29, atk: 84, def: 45, pas: 80, phy: 85 },
    { name: 'Harry Kane', pos: 'ATA', age: 31, atk: 93, def: 46, pas: 86, phy: 84 }
  ],
  bayerleverkusen: [
    { name: 'Lukáš Hrádecký', pos: 'GOL', age: 35, atk: 20, def: 84, pas: 72, phy: 78 },
    { name: 'Jonathan Tah', pos: 'DEF', age: 28, atk: 45, def: 86, pas: 76, phy: 88 },
    { name: 'Edmond Tapsoba', pos: 'DEF', age: 25, atk: 50, def: 84, pas: 82, phy: 86 },
    { name: 'Álex Grimaldo', pos: 'DEF', age: 29, atk: 84, def: 78, pas: 88, phy: 80 },
    { name: 'Jeremie Frimpong', pos: 'DEF', age: 24, atk: 82, def: 74, pas: 80, phy: 93 },
    { name: 'Granit Xhaka', pos: 'MEI', age: 32, atk: 76, def: 85, pas: 89, phy: 84 },
    { name: 'Exequiel Palacios', pos: 'MEI', age: 26, atk: 78, def: 83, pas: 86, phy: 84 },
    { name: 'Florian Wirtz', pos: 'MEI', age: 21, atk: 89, def: 60, pas: 91, phy: 82 },
    { name: 'Victor Boniface', pos: 'ATA', age: 24, atk: 86, def: 38, pas: 72, phy: 89 }
  ],
  dortmund: [
    { name: 'Gregor Kobel', pos: 'GOL', age: 27, atk: 22, def: 87, pas: 76, phy: 83 },
    { name: 'Nico Schlotterbeck', pos: 'DEF', age: 25, atk: 52, def: 85, pas: 82, phy: 86 },
    { name: 'Niklas Süle', pos: 'DEF', age: 29, atk: 45, def: 83, pas: 76, phy: 86 },
    { name: 'Julian Brandt', pos: 'MEI', age: 28, atk: 84, def: 60, pas: 88, phy: 78 },
    { name: 'Marcel Sabitzer', pos: 'MEI', age: 30, atk: 82, def: 78, pas: 84, phy: 82 },
    { name: 'Serhou Guirassy', pos: 'ATA', age: 28, atk: 86, def: 35, pas: 74, phy: 86 },
    { name: 'Karim Adeyemi', pos: 'ATA', age: 23, atk: 83, def: 40, pas: 76, phy: 92 }
  ],
  inter: [
    { name: 'Yann Sommer', pos: 'GOL', age: 36, atk: 20, def: 86, pas: 80, phy: 78 },
    { name: 'Alessandro Bastoni', pos: 'DEF', age: 25, atk: 58, def: 88, pas: 85, phy: 85 },
    { name: 'Benjamin Pavard', pos: 'DEF', age: 28, atk: 62, def: 85, pas: 80, phy: 82 },
    { name: 'Federico Dimarco', pos: 'DEF', age: 27, atk: 82, def: 78, pas: 87, phy: 80 },
    { name: 'Hakan Çalhanoğlu', pos: 'MEI', age: 30, atk: 84, def: 80, pas: 90, phy: 78 },
    { name: 'Nicolò Barella', pos: 'MEI', age: 27, atk: 83, def: 84, pas: 88, phy: 87 },
    { name: 'Henrikh Mkhitaryan', pos: 'MEI', age: 36, atk: 80, def: 72, pas: 85, phy: 74 },
    { name: 'Lautaro Martínez', pos: 'ATA', age: 27, atk: 90, def: 48, pas: 79, phy: 87 },
    { name: 'Marcus Thuram', pos: 'ATA', age: 27, atk: 86, def: 44, pas: 78, phy: 88 }
  ],
  milan: [
    { name: 'Mike Maignan', pos: 'GOL', age: 29, atk: 25, def: 88, pas: 82, phy: 84 },
    { name: 'Fikayo Tomori', pos: 'DEF', age: 27, atk: 45, def: 84, pas: 74, phy: 86 },
    { name: 'Theo Hernández', pos: 'DEF', age: 27, atk: 84, def: 80, pas: 82, phy: 90 },
    { name: 'Tijjani Reijnders', pos: 'MEI', age: 26, atk: 82, def: 76, pas: 86, phy: 84 },
    { name: 'Ruben Loftus-Cheek', pos: 'MEI', age: 28, atk: 80, def: 75, pas: 80, phy: 86 },
    { name: 'Christian Pulisic', pos: 'ATA', age: 26, atk: 85, def: 45, pas: 82, phy: 84 },
    { name: 'Rafael Leão', pos: 'ATA', age: 25, atk: 89, def: 38, pas: 81, phy: 91 },
    { name: 'Álvaro Morata', pos: 'ATA', age: 32, atk: 84, def: 46, pas: 76, phy: 80 }
  ],
  juventus: [
    { name: 'Michele Di Gregorio', pos: 'GOL', age: 27, atk: 20, def: 84, pas: 75, phy: 80 },
    { name: 'Bremer', pos: 'DEF', age: 27, atk: 48, def: 88, pas: 72, phy: 89 },
    { name: 'Danilo', pos: 'DEF', age: 33, atk: 68, def: 82, pas: 78, phy: 78 },
    { name: 'Teun Koopmeiners', pos: 'MEI', age: 26, atk: 84, def: 79, pas: 86, phy: 83 },
    { name: 'Manuel Locatelli', pos: 'MEI', age: 27, atk: 75, def: 83, pas: 84, phy: 82 },
    { name: 'Kenan Yıldız', pos: 'ATA', age: 19, atk: 82, def: 40, pas: 80, phy: 80 },
    { name: 'Dušan Vlahović', pos: 'ATA', age: 24, atk: 88, def: 36, pas: 72, phy: 88 }
  ],
  psg: [
    { name: 'Gianluigi Donnarumma', pos: 'GOL', age: 25, atk: 22, def: 88, pas: 74, phy: 85 },
    { name: 'Marquinhos', pos: 'DEF', age: 30, atk: 52, def: 87, pas: 80, phy: 83 },
    { name: 'Willian Pacho', pos: 'DEF', age: 23, atk: 45, def: 83, pas: 76, phy: 85 },
    { name: 'Achraf Hakimi', pos: 'DEF', age: 26, atk: 84, def: 81, pas: 84, phy: 91 },
    { name: 'Nuno Mendes', pos: 'DEF', age: 22, atk: 80, def: 80, pas: 78, phy: 90 },
    { name: 'Vitinha', pos: 'MEI', age: 24, atk: 80, def: 78, pas: 89, phy: 81 },
    { name: 'Warren Zaïre-Emery', pos: 'MEI', age: 18, atk: 78, def: 80, pas: 84, phy: 84 },
    { name: 'Ousmane Dembélé', pos: 'ATA', age: 27, atk: 88, def: 42, pas: 85, phy: 89 },
    { name: 'Bradley Barcola', pos: 'ATA', age: 22, atk: 86, def: 45, pas: 80, phy: 88 }
  ],
  benfica: [
    { name: 'Anatoliy Trubin', pos: 'GOL', age: 23, atk: 20, def: 84, pas: 74, phy: 82 },
    { name: 'Nicolás Otamendi', pos: 'DEF', age: 36, atk: 48, def: 84, pas: 76, phy: 80 },
    { name: 'António Silva', pos: 'DEF', age: 21, atk: 45, def: 83, pas: 76, phy: 83 },
    { name: 'Orkun Kökçü', pos: 'MEI', age: 24, atk: 82, def: 74, pas: 86, phy: 80 },
    { name: 'Florentino Luís', pos: 'MEI', age: 25, atk: 60, def: 85, pas: 82, phy: 84 },
    { name: 'Ángel Di María', pos: 'ATA', age: 36, atk: 87, def: 45, pas: 90, phy: 72 },
    { name: 'Vangelis Pavlidis', pos: 'ATA', age: 26, atk: 83, def: 38, pas: 74, phy: 82 }
  ],
  sporting: [
    { name: 'Franco Israel', pos: 'GOL', age: 24, atk: 20, def: 81, pas: 74, phy: 78 },
    { name: 'Gonçalo Inácio', pos: 'DEF', age: 23, atk: 55, def: 84, pas: 83, phy: 82 },
    { name: 'Ousmane Diomande', pos: 'DEF', age: 21, atk: 45, def: 83, pas: 76, phy: 87 },
    { name: 'Morten Hjulmand', pos: 'MEI', age: 25, atk: 72, def: 85, pas: 84, phy: 86 },
    { name: 'Hidemasa Morita', pos: 'MEI', age: 29, atk: 75, def: 80, pas: 84, phy: 80 },
    { name: 'Francisco Trincão', pos: 'ATA', age: 25, atk: 83, def: 46, pas: 82, phy: 80 },
    { name: 'Viktor Gyökeres', pos: 'ATA', age: 26, atk: 90, def: 45, pas: 78, phy: 92 }
  ],
  porto: [
    { name: 'Diogo Costa', pos: 'GOL', age: 25, atk: 25, def: 87, pas: 82, phy: 82 },
    { name: 'Nehuén Pérez', pos: 'DEF', age: 24, atk: 45, def: 82, pas: 74, phy: 83 },
    { name: 'Alan Varela', pos: 'MEI', age: 23, atk: 70, def: 84, pas: 84, phy: 84 },
    { name: 'Nico González', pos: 'MEI', age: 23, atk: 80, def: 78, pas: 83, phy: 82 },
    { name: 'Pepê', pos: 'ATA', age: 27, atk: 82, def: 60, pas: 80, phy: 86 },
    { name: 'Wenderson Galeno', pos: 'ATA', age: 27, atk: 84, def: 55, pas: 78, phy: 89 },
    { name: 'Samu Omorodion', pos: 'ATA', age: 20, atk: 84, def: 35, pas: 68, phy: 90 }
  ],
  riverplate: [
    { name: 'Franco Armani', pos: 'GOL', age: 38, atk: 18, def: 83, pas: 70, phy: 76 },
    { name: 'Germán Pezzella', pos: 'DEF', age: 33, atk: 45, def: 83, pas: 74, phy: 82 },
    { name: 'Marcos Acuña', pos: 'DEF', age: 33, atk: 76, def: 82, pas: 82, phy: 84 },
    { name: 'Santiago Simón', pos: 'MEI', age: 22, atk: 75, def: 74, pas: 80, phy: 80 },
    { name: 'Franco Mastantuono', pos: 'MEI', age: 17, atk: 82, def: 50, pas: 83, phy: 76 },
    { name: 'Facundo Colidio', pos: 'ATA', age: 24, atk: 79, def: 42, pas: 75, phy: 80 },
    { name: 'Miguel Borja', pos: 'ATA', age: 31, atk: 85, def: 36, pas: 72, phy: 86 }
  ],
  bocajuniors: [
    { name: 'Sergio Romero', pos: 'GOL', age: 37, atk: 18, def: 82, pas: 72, phy: 76 },
    { name: 'Marcos Rojo', pos: 'DEF', age: 34, atk: 55, def: 82, pas: 74, phy: 83 },
    { name: 'Luis Advíncula', pos: 'DEF', age: 34, atk: 75, def: 78, pas: 75, phy: 88 },
    { name: 'Kevin Zenón', pos: 'MEI', age: 23, atk: 81, def: 72, pas: 82, phy: 82 },
    { name: 'Cristian Medina', pos: 'MEI', age: 22, atk: 78, def: 76, pas: 82, phy: 82 },
    { name: 'Miguel Merentiel', pos: 'ATA', age: 28, atk: 82, def: 50, pas: 74, phy: 84 },
    { name: 'Edinson Cavani', pos: 'ATA', age: 37, atk: 86, def: 45, pas: 78, phy: 80 }
  ],
  penarol: [
    { name: 'Washington Aguerre', pos: 'GOL', age: 31, atk: 18, def: 78, pas: 68, phy: 78 },
    { name: 'Guzmán Rodríguez', pos: 'DEF', age: 24, atk: 40, def: 78, pas: 70, phy: 82 },
    { name: 'Damián García', pos: 'MEI', age: 21, atk: 65, def: 78, pas: 79, phy: 80 },
    { name: 'Leonardo Fernández', pos: 'MEI', age: 26, atk: 84, def: 55, pas: 86, phy: 78 },
    { name: 'Eduardo Darias', pos: 'MEI', age: 26, atk: 75, def: 72, pas: 76, phy: 80 },
    { name: 'Maximiliano Silvera', pos: 'ATA', age: 27, atk: 81, def: 40, pas: 70, phy: 82 }
  ],
  colocolo: [
    { name: 'Brayan Cortés', pos: 'GOL', age: 29, atk: 20, def: 81, pas: 72, phy: 78 },
    { name: 'Maximiliano Falcón', pos: 'DEF', age: 27, atk: 45, def: 80, pas: 70, phy: 84 },
    { name: 'Arturo Vidal', pos: 'MEI', age: 37, atk: 82, def: 80, pas: 84, phy: 82 },
    { name: 'Esteban Pavez', pos: 'MEI', age: 34, atk: 68, def: 79, pas: 78, phy: 80 },
    { name: 'Carlos Palacios', pos: 'ATA', age: 24, atk: 83, def: 42, pas: 80, phy: 80 },
    { name: 'Javier Correa', pos: 'ATA', age: 32, atk: 80, def: 35, pas: 70, phy: 80 }
  ],
  atletico_nacional: [
    { name: 'David Ospina', pos: 'GOL', age: 36, atk: 18, def: 82, pas: 74, phy: 76 },
    { name: 'William Tesillo', pos: 'DEF', age: 34, atk: 45, def: 80, pas: 75, phy: 80 },
    { name: 'Jorman Campuzano', pos: 'MEI', age: 28, atk: 66, def: 80, pas: 80, phy: 82 },
    { name: 'Edwin Cardona', pos: 'MEI', age: 32, atk: 83, def: 50, pas: 86, phy: 76 },
    { name: 'Marino Hinestroza', pos: 'ATA', age: 22, atk: 80, def: 40, pas: 75, phy: 86 },
    { name: 'Alfredo Morelos', pos: 'ATA', age: 28, atk: 83, def: 38, pas: 70, phy: 86 }
  ],
  olimpia: [
    { name: 'Gastón Olveira', pos: 'GOL', age: 31, atk: 18, def: 81, pas: 70, phy: 78 },
    { name: 'Saúl Salcedo', pos: 'DEF', age: 27, atk: 42, def: 78, pas: 70, phy: 82 },
    { name: 'Richard Ortiz', pos: 'MEI', age: 34, atk: 72, def: 79, pas: 76, phy: 82 },
    { name: 'Derlis González', pos: 'ATA', age: 30, atk: 82, def: 45, pas: 78, phy: 82 },
    { name: 'Lucas Pratto', pos: 'ATA', age: 36, atk: 80, def: 45, pas: 75, phy: 82 }
  ],
  ldu_quito: [
    { name: 'Alexander Domínguez', pos: 'GOL', age: 37, atk: 18, def: 82, pas: 70, phy: 80 },
    { name: 'Ricardo Adé', pos: 'DEF', age: 34, atk: 42, def: 81, pas: 70, phy: 85 },
    { name: 'Ezequiel Piovi', pos: 'MEI', age: 32, atk: 72, def: 80, pas: 82, phy: 82 },
    { name: 'Fernando Cornejo', pos: 'MEI', age: 28, atk: 76, def: 75, pas: 78, phy: 80 },
    { name: 'Alex Arce', pos: 'ATA', age: 29, atk: 84, def: 35, pas: 70, phy: 85 }
  ],
  universitario: [
    { name: 'Sebastián Britos', pos: 'GOL', age: 34, atk: 18, def: 79, pas: 68, phy: 78 },
    { name: 'Aldo Corzo', pos: 'DEF', age: 35, atk: 58, def: 79, pas: 72, phy: 78 },
    { name: 'Rodrigo Ureña', pos: 'MEI', age: 31, atk: 70, def: 80, pas: 80, phy: 82 },
    { name: 'Martín Pérez Guedes', pos: 'MEI', age: 33, atk: 78, def: 70, pas: 78, phy: 78 },
    { name: 'Andy Polo', pos: 'ATA', age: 30, atk: 80, def: 60, pas: 78, phy: 86 },
    { name: 'Edison Flores', pos: 'ATA', age: 30, atk: 82, def: 52, pas: 80, phy: 78 },
    { name: 'Alex Valera', pos: 'ATA', age: 28, atk: 81, def: 38, pas: 68, phy: 82 }
  ],
  alianza_lima: [
    { name: 'Ángelo Campos', pos: 'GOL', age: 31, atk: 18, def: 79, pas: 70, phy: 78 },
    { name: 'Carlos Zambrano', pos: 'DEF', age: 35, atk: 52, def: 81, pas: 74, phy: 82 },
    { name: 'Erick Noriega', pos: 'DEF', age: 23, atk: 45, def: 78, pas: 72, phy: 80 },
    { name: 'Sebastián Rodríguez', pos: 'MEI', age: 32, atk: 78, def: 72, pas: 83, phy: 76 },
    { name: 'Kevin Serna', pos: 'ATA', age: 27, atk: 81, def: 48, pas: 76, phy: 88 },
    { name: 'Hernán Barcos', pos: 'ATA', age: 40, atk: 82, def: 36, pas: 76, phy: 74 },
    { name: 'Paolo Guerrero', pos: 'ATA', age: 41, atk: 82, def: 35, pas: 75, phy: 74 }
  ]
};

/**
 * Gera um elenco completo e coerente (20 jogadores) para um determinado clube
 * @param {Object} club 
 * @returns {Array} Array de 20 jogadores
 */
export function generateClubSquad(club) {
  const squad = [];
  const league = getLeagueById(club.leagueId);
  const regionCode = league?.countryCode || 'BR';
  const namePool = ROSTER_NAMES[regionCode] || ROSTER_NAMES.BR;

  // Distribuição equilibrada: 3 GOL, 6 DEF, 6 MEI, 5 ATA = 20 jogadores
  const positionsLayout = [
    { pos: 'GOL', count: 3 },
    { pos: 'DEF', count: 6 },
    { pos: 'MEI', count: 6 },
    { pos: 'ATA', count: 5 }
  ];

  const presets = PRESET_STARS[club.id] ? PRESET_STARS[club.id].map(p => ({ ...p })) : [];
  let presetIndex = 0;
  let playerSequence = 1;

  positionsLayout.forEach(({ pos, count }) => {
    for (let i = 0; i < count; i++) {
      const playerId = `${club.id}_p${String(playerSequence).padStart(2, '0')}`;
      playerSequence++;

      // Se houver estrela pré-definida para esta posição
      const matchingPresetIndex = presets.findIndex(p => p.pos === pos);
      let newPlayer = null;

      if (matchingPresetIndex !== -1) {
        const star = presets.splice(matchingPresetIndex, 1)[0];
        const overall = calculatePlayerOverall({
          attack: star.atk,
          defense: star.def,
          pass: star.pas,
          physical: star.phy,
          position: star.pos
        });

        // Salário e valor de mercado baseados na liga e força
        const mult = league?.currencySymbol === 'R$' ? 1.0 : (league?.currencySymbol === '£' ? 0.35 : 0.4);
        const salary = Math.round((overall * overall * 22) * mult);
        const marketValue = Math.round((overall * overall * 1800 * (34 - Math.min(32, star.age)) / 10) * mult);

        newPlayer = {
          id: playerId,
          clubId: club.id,
          name: star.name,
          age: star.age,
          position: star.pos,
          attack: star.atk,
          defense: star.def,
          pass: star.pas,
          physical: star.phy,
          overall,
          salary,
          marketValue,
          morale: 'Excelente',
          fitness: 98
        };
      } else {
        // Geração com base no Overall do clube e posição
        const variance = (i === 0) ? 2 : (i === 1 ? -1 : -4); // Titular > Reserva imediato > Base
        const targetOvr = Math.min(94, Math.max(58, club.overall + variance + Math.floor((Math.random() * 4) - 2)));

        let atk = targetOvr - 20;
        let def = targetOvr - 20;
        let pas = targetOvr - 15;
        let phy = targetOvr - 10;

        if (pos === 'GOL') {
          def = targetOvr + 3;
          phy = targetOvr;
          pas = Math.max(40, targetOvr - 18);
          atk = Math.max(15, targetOvr - 45);
        } else if (pos === 'DEF') {
          def = targetOvr + 2;
          phy = targetOvr;
          pas = Math.max(45, targetOvr - 10);
          atk = Math.max(25, targetOvr - 30);
        } else if (pos === 'MEI') {
          pas = targetOvr + 2;
          atk = targetOvr - 5;
          def = targetOvr - 8;
          phy = targetOvr - 2;
        } else if (pos === 'ATA') {
          atk = targetOvr + 3;
          phy = targetOvr;
          pas = targetOvr - 8;
          def = Math.max(25, targetOvr - 35);
        }

        // Idade entre 19 e 34
        const age = 19 + Math.floor(Math.random() * 15);

        // Nome gerado aleatoriamente da região
        const firstName = namePool.first[(playerSequence * 7 + i) % namePool.first.length];
        const lastName = namePool.last[(playerSequence * 11 + i) % namePool.last.length];

        const tempPlayer = {
          attack: Math.min(99, Math.max(20, atk)),
          defense: Math.min(99, Math.max(20, def)),
          pass: Math.min(99, Math.max(25, pas)),
          physical: Math.min(99, Math.max(30, phy)),
          position: pos
        };

        const calculatedOvr = calculatePlayerOverall(tempPlayer);
        const mult = league?.currencySymbol === 'R$' ? 1.0 : (league?.currencySymbol === '£' ? 0.35 : 0.4);
        const salary = Math.round((calculatedOvr * calculatedOvr * 18) * mult);
        const marketValue = Math.round((calculatedOvr * calculatedOvr * 1400 * (35 - Math.min(33, age)) / 10) * mult);

        newPlayer = {
          id: playerId,
          clubId: club.id,
          name: `${firstName} ${lastName}`,
          age,
          position: pos,
          attack: tempPlayer.attack,
          defense: tempPlayer.defense,
          pass: tempPlayer.pass,
          physical: tempPlayer.physical,
          overall: calculatedOvr,
          salary,
          marketValue,
          morale: 'Boa',
          fitness: 95 + Math.floor(Math.random() * 5)
        };
      }

      squad.push(newPlayer);
    }
  });

  return squad;
}
