import logging
from io import BytesIO

from mojap_metadata.converters.arrow_converter import ArrowConverter
from mojap_metadata.converters.glue_converter import GlueConverter
from mojap_metadata.metadata.metadata import Metadata
from pyarrow import csv as pa_csv

logger = logging.getLogger(__name__)


class GlueSchemaGenerator:
    """
    Generate the glue schema from a data file
    """

    def __init__(
        self,
    ):
        self.ac = ArrowConverter()
        self.gc = GlueConverter()

    def infer_from_raw_csv(
        self,
        bytes_stream: BytesIO,
        table_name: str,
        database_name: str,
        table_location: str,
        has_headers: bool = True,
    ):
        """
        Generate schema metadata by inferring the schema of a sample of raw data (CSV)
        """
        # null_values has been set to an empty list as "N/A" was being read as null (in a numeric column), with
        # type inferred as int but "N/A" persiting in the csv and so failing to be cast as an int.
        # Empty list means nothing inferred as null other than null.
        arrow_table = pa_csv.read_csv(
            bytes_stream, convert_options=pa_csv.ConvertOptions(null_values=[])
        )

        metadata_mojap = self.ac.generate_to_meta(arrow_schema=arrow_table.schema)

        self._standardise_metadata(
            metadata_mojap=metadata_mojap, table_name=table_name, file_type="csv"
        )

        metadata_glue = self.gc.generate_from_meta(
            metadata_mojap,
            database_name=database_name,
            table_location=table_location,
        )

        if has_headers:
            metadata_glue["TableInput"]["Parameters"]["skip.header.line.count"] = "1"
            metadata_glue["TableInput"]["StorageDescriptor"]["SerdeInfo"][
                "SerializationLibrary"
            ] = "org.apache.hadoop.hive.serde2.OpenCSVSerde"

        return metadata_glue

    def _standardise_metadata(
        self, metadata_mojap: Metadata, table_name: str, file_type: str
    ):
        """
        Standardise the inferred metadata by adding table name/file type and enforcing
        naming conventions.
        """
        metadata_mojap.name = table_name
        metadata_mojap.file_format = file_type
        metadata_mojap.column_names_to_lower(inplace=True)

        for col in metadata_mojap.columns:
            if col["type"] == "null":
                col["type"] = "string"
            # no spaces or brackets are allowed in the column name
            col["name"] = (
                col["name"].replace(" ", "_").replace("(", "").replace(")", "")
            )


def run(input_data):
    schema_generator = GlueSchemaGenerator()
    return schema_generator.infer_from_raw_csv(
        BytesIO(input_data.encode("utf8")), "MyTable", "MyDatabase", "s3://blablabla"
    )
