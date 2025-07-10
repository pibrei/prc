/**
 * Normaliza o nome do batalhão para um nome de arquivo válido
 * Remove acentos, caracteres especiais e substitui espaços por underscore
 */
export const normalizeBattalionFileName = (battalionName: string): string => {
  return battalionName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '_') // Substitui espaços por underscore
    + '.png';
};

/**
 * Exemplos de conversão:
 * "2º BPM" -> "2_bpm.png"
 * "3º Batalhão de Polícia Militar" -> "3_batalhao_de_policia_militar.png"
 */