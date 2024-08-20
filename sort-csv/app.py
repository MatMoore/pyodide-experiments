import csv
from io import StringIO


def run(input_data):
    infile = StringIO(input_data)
    rows = list(csv.reader(infile))

    sortedrows = sorted(rows, key=lambda row: row[0])

    output = StringIO()
    csv.writer(output).writerows(sortedrows)
    return output.getvalue()
