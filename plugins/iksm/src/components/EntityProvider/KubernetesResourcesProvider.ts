import { UrlReader } from '@backstage/backend-common';
import {ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION, Entity} from '@backstage/catalog-model';
import {
    EntityProvider,
    EntityProviderConnection,
} from '@backstage/plugin-catalog-node';

/**
 * Provides entities from iksm service.
 */
export class KubernetesResourcesProvider implements EntityProvider {
    private readonly env: string;
    private readonly reader: UrlReader;
    private connection?: EntityProviderConnection;

    /** [1] */
    constructor(env: string, reader: UrlReader) {
        this.env = env;
        this.reader = reader;
    }

    /** [2] */
    getProviderName(): string {
        return `iksm-${this.env}`;
    }

    /** [3] */
    async connect(connection: EntityProviderConnection): Promise<void> {
        this.connection = connection;
    }

    /** [4] */
    async run(): Promise<void> {
        if (!this.connection) {
            throw new Error('Not initialized');
        }

        const response = await this.reader.readUrl(
            `http://localhost:7373/getResources/numaflow-assets-1`,
        );

        console.log("response")
        console.log((await response.buffer()).toString())
        const data = JSON.parse((await response.buffer()).toString());
        console.log(data.namespaceName)

        /** [5] */
        const entities: Entity[] = this.iksmResourcesToEntities(data.namespaceName);

        /** [6] */
        await this.connection.applyMutation({
            type: 'full',
            entities: entities.map(entity => ({
                entity,
                locationKey: `iksm-provider:${this.env}`,
            })),
        });
    }


    iksmResourcesToEntities(namespace: string): Entity[] {
        return [{
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Resource',
            metadata: {
                name: namespace,
                annotations: {
                    "backstage.io/managed-by-location": `iksm-provider:${this.env}`,
                    "backstage.io/managed-by-origin-location": `iksm-provider:${this.env}`,
                },
            },
            spec: {
                type: 'k8s-namespace',
                lifecycle: 'experimental',
                owner: 'numaflow-developers',
                dependencyOf: 'component:default/numaflow-assets-1',
            }
        }];
    }
}
