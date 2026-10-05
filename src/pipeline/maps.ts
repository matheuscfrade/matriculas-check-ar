export const rendaTrocar: Record<string, string> = {
  "Entre meio salário mínimo e um salário mínimo": "Entre 0,5 e 1 S.M",
  "Até meio salário mínimo": "Até 0,5 S.M.",
  "Entre um salário mínimo e meio e dois salários mínimos e meio":
    "Entre 1,5 e 2,5 S.M.",
  "Entre dois salários mínimos e meio e três salários mínimos":
    "Entre 2,5 e 3 S.M.",
  "Acima de três salários mínimos": "Mais de 3 S.M.",
  "Entre um salário mínimo e um salário mínimo e meio": "Entre 1 e 1,5 S.M.",
};

export const escolaridadeTrocar: Record<string, string> = {
  "Ensino Fundamental completo": "Superior Completo",
  "Ensino Fundamental incompleto": "Superior Incompleto",
  "Ensino Médio completo": "Médio Completo",
  "Ensino Médio incompleto": "Médio Incompleto",
  "Ensino Superior incompleto": "Graduação Incompleta",
  "Ensino Superior completo": "Graduação Completa",
  "Pós-graduação": "Pós-Graduação",
};

export const ingressoTrocar: Record<string, string> = {
  "CADASTRO DE RESERVA": "CR",
};

export const ifTrocar: Record<string, string> = {
  "Instituto Federal Sul-rio-grandense": "IFSUL",
  "Instituto Federal do Paraná": "IFPR",
  "Instituto Federal Fluminense": "IFF",
  "Instituto Federal de Minas Gerais": "IFMG",
  "Instituto Federal de São Paulo (São José dos Campos)": "IFSP",
  "Instituto Federal de São Paulo (Cubatão)": "IFSP",
  "Instituto Federal do Espírito Santo": "IFES",
  "Instituto Federal do Rio Grande do Sul": "IFRS",
  "Instituto Federal de Pernambuco": "IFPE",
};

export function remap(value: string, dict: Record<string, string>): string {
  return dict[value] ?? value;
}
