### **Visão Geral do Projeto**

O projeto consiste em desenvolver um **Agente Inteligente** para atuar no **Mundo de Wumpus**, um ambiente parcialmente observável com perigos (poços e o Wumpus) e um objetivo (ouro). O projeto está dividido em cinco etapas, cada uma com entregas específicas.

---

### **Etapa 1: Gerador Aleatório de Ambientes**

**Objetivo:** Criar um programa que gere aleatoriamente ambientes (mapas) para o Mundo de Wumpus.

**O que deve ser entregue:**

- Um ambiente representado por uma **matriz quadrada de tamanho `n`** (onde `n > 3`).
- Posicionamento dos seguintes elementos:
    - Poços (`p`)
    - Wumpus (`W`)
    - Ouro (`o`)
- A quantidade desses elementos pode ser:
    - Definida pelo usuário.
    - Ou calculada automaticamente com base no tamanho `n` (ex.: porcentagem do total de casas).
- **Percepções** (brisa, fedor, brilho) devem ser posicionadas corretamente com base na localização dos objetos.
- A casa `(0, 0)` (início do agente) **não pode conter nenhum objeto**.
- **Restrição:** Poços não podem coexistir com Wumpus ou ouro na mesma casa.

---

### **Etapa 2: Agente Reativo (Versão 1)**

**Objetivo:** Implementar um agente que age com base **apenas nas percepções atuais**, sem memória.

**O que deve ser entregue:**

- Uma **tabela de regras** no formato:
    - **SE** <percepções> **ENTÃO** <ação>
- Exemplo:
    - SE {Fedor} ENTÃO Mover-se com cuidado;
    - SE {Brisa} ENTÃO Mover-se com cuidado.
- O agente deve ser integrado ao gerador de ambientes.
- **Características do Agente v1:**
    - Não tem memória.
    - Escolhe ações aleatoriamente se múltiplas regras forem aplicáveis.

---

### **Etapa 3: Agente Reativo (Versão 2)**

**Objetivo:** Melhorar o agente da Versão 1 adicionando **memória** e um **mecanismo inteligente de decisão**.

**O que deve ser entregue:**

- Uma **estrutura de memória** (matriz que replica o ambiente, lista de casas visitadas)
- Um **mecanismo de escolha de regras** mais inteligente (ex.: priorizar ações que levam a casas não visitadas, evitar perigos conhecidos).
- O agente deve usar a memória para:
    - Evitar repetir ações.
    - Fazer inferências simples (ex.: se não há brisa, a casa adjacente é segura).
- **Classificação do agente:** Justificar se é um agente **reativo com estado** ou **baseado em modelo**.
- Criatividade é incentivada! (ex.: adicionar heurísticas simples de planejamento).

---

### **Etapa 4: Agente de Aprendizagem (Versão 3)**

**Objetivo:** Desenvolver um agente que **aprende** a melhor sequência de ações usando **Algoritmos Genéticos (AG)**.

**O que deve ser entregue:**

- Um algoritmo genético que evolui **estratégias de ação** (sequências de movimentos).
- **Componentes do AG:**
    - **Codificação:** Como representar uma sequência de ações (ex.: string de genes onde cada gene é uma ação).
    - **Seleção:** Método do Torneio.
    - **Cruzamento e Mutação:** Operadores para variar as soluções.
    - **Função de Fitness:** Avalia quão boa é uma sequência de ações (ex.: pontuação baseada em conseguir o ouro e voltar vivo).

---

### **Etapa 5: Validação e Resultados**

**Objetivo:** Testar e comparar o desempenho dos três agentes em diferentes cenários.

**O que deve ser entregue:**

- **Testes em ambientes de tamanhos variados:** `n = 4, 5, 10, 15, 20`.
- **30 execuções** para cada agente em cada tamanho de ambiente.
- **Métricas de avaliação:**
    - Sucesso na missão: sair, pegar o ouro e voltar para (0,0).
    - Pontuação (score):
        - -1 por ação.
        - -1000 por cair em poço ou ser devorado pelo Wumpus.
        - +1000 por pegar o ouro
        - +1000 por voltar para a casa inicial com o ouro
- **Configurações fixas** para o Agente de Aprendizagem (AG):
    - População: 50
    - Gerações: 1000
    - Taxa de cruzamento: 85%
    - Taxa de mutação: 5%
- **Gráficos**:
    - Para os agentes v1 e v2: desempenho (sucesso e pontuação média).
    - Para o agente v3: curva de aprendizado (fitness médio, melhor e pior a cada geração).
- **Tabela resumo** com os resultados de todas as execuções.
