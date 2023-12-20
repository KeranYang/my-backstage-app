import React from 'react';
import { Table, TableColumn, Progress, ResponseErrorPanel } from '@backstage/core-components';
import useAsync from 'react-use/lib/useAsync';
import axios from "axios";
import {useEntity} from "@backstage/plugin-catalog-react";

/*
export const exampleResources = {
  "results": [
    {
      "assetId": "numaflow-assets-1",
      "namespaceName": "default",
      "clusterName": "cluster-1",
    },
  ]
}
 */

type Resource = {
  assetId: string; // "numaflow-assets-1"
  namespaceName: string; // "default"
  clusterName: string; // "cluster-1"
};

type DenseTableProps = {
  resources: Resource[];
};

export const DenseTable = ({ resources }: DenseTableProps) => {

  const columns: TableColumn[] = [
    { title: 'AssetId', field: 'assetId' },
    { title: 'Namespace', field: 'namespaceName' },
    { title: 'Cluster', field: 'clusterName' },
  ];

  const data = resources.map(resource => {
    return {
      assetId: resource.assetId,
      namespaceName: resource.namespaceName,
      clusterName: resource.clusterName,
    };
  });

  return (
    <Table
      title="Asset Resources"
      options={{ search: false, paging: false }}
      columns={columns}
      data={data}
    />
  );
};

export const ExampleFetchComponent = () => {
  const entity = useEntity();
  const assetId = entity.entity.metadata.name;
  const { value, loading, error } = useAsync(async (): Promise<Resource[]> => {
    /*
    console.log(exampleResources.results)
    console.log("--------------------")
    const response = await axios.get(`http://localhost:7373/getResources/1`);
    console.log([response.data])
    return exampleResources.results;
    */

    // for now, let's just hardcode the assetId,
    // in the future, we'll want to pass this in from the application that uses this plugin
    try {
      const response = await axios.get(`http://localhost:7373/getResources/${assetId}`);
        return [response.data];
    } catch (e) {
        throw e;
    }
  }, []);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <ResponseErrorPanel error={error} />;
  }
  return <DenseTable resources={value || []} />;
};
