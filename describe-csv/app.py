from io import StringIO

import pandas


def run(input_data) -> pandas.DataFrame:
    infile = pandas.read_csv(StringIO(input_data))
    return infile.describe()
