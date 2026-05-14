/**
 * Thin GraphQL client: createDataSDK + data.graphql with centralized error handling.
 * Use with gql-tagged queries and generated operation types for type-safe calls.
 */
import { createDataSDK } from '@salesforce/sdk-data';

export async function executeGraphQL<TData, TVariables = Record<string, unknown>>(
  query: string,
  variables?: TVariables
): Promise<TData> {
  const data = await createDataSDK();
  if (!data.graphql) {
    throw new Error('SDK graphql client not available');
  }
  const response = await data.graphql<TData, TVariables>({
    query,
    variables: variables as TVariables,
  });

  if (response.errors?.length) {
    const msg = response.errors.map((e) => e.message).join('; ');
    throw new Error(`GraphQL Error: ${msg}`);
  }

  return response.data as TData;
}
