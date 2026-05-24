# 📊 Diagrama Entidade-Relacionamento (ERD)

## Entidade: VAGAS

```
┌─────────────────────────────────────────┐
│              VAGAS                      │
├─────────────────────────────────────────┤
│ PK │ id (INTEGER)                       │
├────┼─────────────────────────────────────┤
│    │ title (TEXT) [NOT NULL]            │
│    │ company (TEXT) [NOT NULL]          │
│    │ location (TEXT) [NOT NULL]         │
│    │ time (TEXT)                        │
│    │ type (TEXT)                        │
│    │ salary (TEXT)                      │
│    │ target (TEXT) [NOT NULL]           │
│    │ desc (TEXT)                        │
│    │ requirements (TEXT - JSON)         │
│    │ benefits (TEXT - JSON)             │
└─────────────────────────────────────────┘
```

## Descrição dos Campos

| Campo | Tipo | Restrição | Descrição |
|-------|------|-----------|-----------|
| `id` | INTEGER | PK, AUTO | Identificador único |
| `title` | TEXT | NOT NULL | Título da vaga |
| `company` | TEXT | NOT NULL | Empresa |
| `location` | TEXT | NOT NULL | Localização |
| `time` | TEXT | - | Tempo publicação |
| `type` | TEXT | - | Tipo (Estágio, CLT) |
| `salary` | TEXT | - | Salário/Bolsa |
| `target` | TEXT | NOT NULL | Curso alvo |
| `desc` | TEXT | - | Descrição |
| `requirements` | TEXT | - | Requisitos (JSON) |
| `benefits` | TEXT | - | Benefícios (JSON) |

## Modelo Físico (SQL)

```sql
CREATE TABLE IF NOT EXISTS vagas (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    company     TEXT    NOT NULL,
    location    TEXT    NOT NULL,
    time        TEXT    DEFAULT 'Agora mesmo',
    type        TEXT    DEFAULT 'Estágio',
    salary      TEXT    DEFAULT 'A combinar',
    target      TEXT    NOT NULL,
    desc        TEXT    DEFAULT '',
    requirements TEXT   DEFAULT '[]',
    benefits    TEXT    DEFAULT '[]'
)
```

## Exemplo de Documento

```json
{
  "id": 1,
  "title": "Desenvolvedor Back-end",
  "company": "Tech Solutions",
  "location": "São Paulo - SP",
  "time": "Há 1 hora",
  "type": "Estágio",
  "salary": "R$ 1500,00",
  "target": "Informática",
  "desc": "Desenvolvimento de APIs REST",
  "requirements": ["Node.js", "Express", "SQL"],
  "benefits": ["Vale Refeição", "Vale Transporte"]
}
```

**Data:** Maio 2026
