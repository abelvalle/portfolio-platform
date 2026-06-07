import { ConfigService } from '@nestjs/config';
import { CvAiAdapterService } from './cv-ai-adapter.service';

type MutableGlobalFetch = typeof globalThis & { fetch?: typeof fetch };

const originalFetch = (global as MutableGlobalFetch).fetch;

describe('CvAiAdapterService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    restoreFetch();
  });

  it('returns null when no optional AI adapter URL is configured', async () => {
    const service = new CvAiAdapterService({
      get: () => undefined,
    } as unknown as ConfigService);

    await expect(
      service.propose({
        targetRole: 'Delivery Manager',
        jobDescription: 'Delivery, KPIs, UAT and stakeholders',
        keywords: ['delivery'],
        source: {},
      }),
    ).resolves.toBeNull();
  });

  it('sends a sanitized source payload and returns pending-review suggestions', async () => {
    const fetchMock = mockFetch({
      ok: true,
      json: async () => ({
        suggestedSummary: '  Delivery summary  ',
        prioritizedSkillNames: [' KPIs ', '', 'UAT'],
        prioritizedExperienceCompanies: [' Demo Company '],
        notes: [' Review tone '],
        inventedField: 'ignored',
      }),
    } as Response);
    const service = new CvAiAdapterService(
      mockConfig({
        CV_AI_ADAPTER_URL: 'https://ai.example.test/adapt',
        CV_AI_ADAPTER_API_KEY: 'secret-token',
      }),
    );

    const result = await service.propose({
      targetRole: 'Delivery Manager',
      targetCompany: 'Target Co',
      jobDescription: 'Delivery with KPIs and UAT',
      keywords: ['delivery', 'kpis'],
      source: {
        summary: 'Real summary',
        email: 'private@example.com',
        links: [{ label: 'LinkedIn', url: 'https://linkedin.example' }],
        skills: [{ name: 'KPIs', category: 'Reporting', level: 'Advanced' }],
        experiences: [
          {
            role: 'IT Project Manager',
            company: 'Demo Company',
            description: 'Delivery',
            responsibilities: ['UAT'],
            achievements: ['Reporting'],
            technologies: ['Azure'],
            privateNotes: 'drop me',
          },
        ],
      },
    });

    expect(result).toEqual({
      provider: 'external-ai',
      suggestedSummary: 'Delivery summary',
      prioritizedSkillNames: ['KPIs', 'UAT'],
      prioritizedExperienceCompanies: ['Demo Company'],
      notes: ['Review tone'],
      pendingReview: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://ai.example.test/adapt',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer secret-token',
        }),
      }),
    );

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    if (typeof init.body !== 'string') {
      throw new Error('Expected serialized JSON request body');
    }
    const body = JSON.parse(init.body) as {
      source: {
        email?: string;
        links?: unknown[];
        skills?: unknown[];
        experiences?: unknown[];
      };
    };
    expect(body.source.email).toBeUndefined();
    expect(body.source.links).toBeUndefined();
    expect(body.source.skills).toEqual([
      { name: 'KPIs', category: 'Reporting' },
    ]);
    expect(body.source.experiences).toEqual([
      {
        role: 'IT Project Manager',
        company: 'Demo Company',
        description: 'Delivery',
        responsibilities: ['UAT'],
        achievements: ['Reporting'],
        technologies: ['Azure'],
      },
    ]);
  });

  it('returns null when the optional AI provider fails', async () => {
    mockFetch({
      ok: false,
      status: 503,
      json: async () => ({}),
    } as Response);
    const service = new CvAiAdapterService(
      mockConfig({ CV_AI_ADAPTER_URL: 'https://ai.example.test/adapt' }),
    );

    await expect(
      service.propose({
        targetRole: 'Delivery Manager',
        jobDescription: 'Delivery with KPIs and UAT',
        keywords: ['delivery'],
        source: {},
      }),
    ).resolves.toBeNull();
  });
});

function mockFetch(response: Response) {
  const fetchMock = jest.fn(async () => response) as jest.MockedFunction<
    typeof fetch
  >;
  Object.defineProperty(global, 'fetch', {
    configurable: true,
    value: fetchMock,
    writable: true,
  });
  return fetchMock;
}

function restoreFetch() {
  const mutableGlobal = global as MutableGlobalFetch;
  if (originalFetch) {
    mutableGlobal.fetch = originalFetch;
    return;
  }
  delete mutableGlobal.fetch;
}

function mockConfig(values: Record<string, string>) {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}
