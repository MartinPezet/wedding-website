import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describeFeature, loadFeature, setVitestCucumberConfiguration } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'

setVitestCucumberConfiguration({ excludeTags: ['manual'] })

const feature = await loadFeature('tests/features/dev-workflow.feature')

const read = (path: string) => readFileSync(path, 'utf8')

// bootstrap change predates the TDD rule (had completed tasks at migration
// time); the spec scopes migration to changes with zero completed tasks
const MIGRATION_EXEMPT = ['archive', 'add-tdd-bdd-workflow']

const migratedChangeDirs = () =>
  readdirSync('openspec/changes', { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !MIGRATION_EXEMPT.includes(entry.name))
    .map(entry => join('openspec/changes', entry.name))

const firstTaskOfEachGroupIsTestWriting = (tasksMd: string) =>
  tasksMd
    .split(/^## /m)
    .slice(1)
    .every((group) => {
      const firstTask = group.split('\n').find(line => /^- \[[ x]\]/.test(line))
      return firstTask !== undefined && /test|red|\.feature/i.test(firstTask)
    })

describeFeature(feature, (f) => {
  f.Rule('Repo has a runnable test suite', (r) => {
    r.RuleScenario('Test command runs the whole suite', (s) => {
      let scripts: Record<string, string> = {}
      s.Given('the repo package.json', () => {
        expect(existsSync('package.json')).toBe(true)
      })
      s.When('its scripts are read', () => {
        scripts = JSON.parse(read('package.json')).scripts
      })
      s.Then('a test script invoking vitest exists', () => {
        expect(scripts.test).toContain('vitest')
      })
    })

    r.RuleScenario('Feature files are executable', (s) => {
      s.Given('a feature file under tests/features/', () => {
        expect(existsSync('tests/features/dev-workflow.feature')).toBe(true)
      })
      s.When('the suite runs', () => {})
      s.Then('its scenarios execute as test cases', () => {
        // this scenario executing at all is the proof
        expect(feature.name).toBe('Dev workflow')
      })
    })
  })

  f.Rule('Specs project to Gherkin feature files', (r) => {
    r.RuleScenario('Spec scenario maps to Gherkin', (s) => {
      let spec = ''
      let projection = ''
      s.Given('the dev-workflow capability spec', () => {
        spec = read('openspec/specs/dev-workflow/spec.md')
      })
      s.When('the projected feature file is read', () => {
        projection = read('tests/features/dev-workflow.feature')
      })
      s.Then('it contains a tagged Rule for each requirement', () => {
        const requirements = [...spec.matchAll(/^### Requirement: (.+)$/gm)].map(m => m[1].trim())
        expect(requirements.length).toBeGreaterThan(0)
        for (const requirement of requirements) {
          expect(projection).toContain(`Rule: ${requirement}`)
        }
        expect(projection).toMatch(/@req:[a-z0-9-]+/)
      })
    })
  })

  f.Rule('OpenSpec workflow enforces TDD', (r) => {
    const schemaYaml = () => read('openspec/schemas/spec-driven-bdd/schema.yaml')

    r.RuleScenario('Task lists are TDD-shaped', (s) => {
      let schema = ''
      s.Given('the spec-driven-bdd schema', () => {
        schema = schemaYaml()
      })
      s.When('the tasks instruction is read', () => {})
      s.Then('it requires each group to start with a failing-test task', () => {
        expect(schema).toMatch(/FIRST task of every group/)
        expect(schema).toMatch(/FAIL \(red\)/)
      })
    })

    r.RuleScenario('Apply loop is red-green-refactor', (s) => {
      let schema = ''
      s.Given('the spec-driven-bdd schema', () => {
        schema = schemaYaml()
      })
      s.When('the apply instruction is read', () => {})
      s.Then('it forbids implementation before a failing test exists', () => {
        expect(schema).toMatch(/Never write implementation code before a failing test/)
      })
    })

    r.RuleScenario('New changes get the BDD schema', (s) => {
      let config = ''
      s.Given('the openspec config', () => {
        config = read('openspec/config.yaml')
      })
      s.When('the default schema is read', () => {})
      s.Then('it is spec-driven-bdd', () => {
        expect(config).toMatch(/^schema: spec-driven-bdd$/m)
      })
    })
  })

  f.Rule('Repo carries AI-facing conventions', (r) => {
    r.RuleScenario('Agent reads conventions at session start', (s) => {
      let claudeMd = ''
      s.Given('the repo root', () => {
        expect(existsSync('CLAUDE.md')).toBe(true)
      })
      s.When('CLAUDE.md is read', () => {
        claudeMd = read('CLAUDE.md')
      })
      s.Then('it documents the test command and the TDD rule', () => {
        expect(claudeMd).toContain('npm test')
        expect(claudeMd).toMatch(/TDD/)
      })
    })

    r.RuleScenario('Artifact generation uses project context', (s) => {
      let config = ''
      s.Given('the openspec config', () => {
        config = read('openspec/config.yaml')
      })
      s.When('the context field is read', () => {})
      s.Then('it describes the tech stack and conventions', () => {
        expect(config).toMatch(/^context: \|/m)
        expect(config).toMatch(/Nuxt/)
      })
    })
  })

  f.Rule('Active changes are migrated to the BDD workflow', (r) => {
    r.RuleScenario('Migrated change is apply-ready under new schema', (s) => {
      let changeDirs: string[] = []
      s.Given('every migrated active change in openspec/changes', () => {
        changeDirs = migratedChangeDirs()
        expect(changeDirs.length).toBeGreaterThan(0)
      })
      s.When('its openspec yaml is read', () => {})
      s.Then('the schema is spec-driven-bdd', () => {
        for (const dir of changeDirs) {
          expect(read(join(dir, '.openspec.yaml')), `${dir} schema`).toMatch(/^schema: spec-driven-bdd$/m)
        }
      })
    })

    r.RuleScenario('Migrated tasks are TDD-ordered', (s) => {
      let changeDirs: string[] = []
      s.Given('every migrated active change in openspec/changes', () => {
        changeDirs = migratedChangeDirs()
      })
      s.When('its tasks file is read', () => {})
      s.Then('each task group starts with a test-writing task', () => {
        for (const dir of changeDirs) {
          expect(
            firstTaskOfEachGroupIsTestWriting(read(join(dir, 'tasks.md'))),
            `${dir}/tasks.md first task of each group`,
          ).toBe(true)
        }
      })
    })
  })
})
