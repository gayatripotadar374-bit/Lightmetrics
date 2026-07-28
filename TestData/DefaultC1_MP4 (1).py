"""
Script to computer performance numbers for the trip simulation output with the ground truth
"""
import os.path
import os
import pandas as pd
import argparse
import json


class TripSimAnalyser:
    def __init__(self, gtfile, benchfile):
        gtdf = pd.read_csv(gtfile)
        benchdf = pd.read_csv(benchfile)

        # Treat presence of events as binary 1/0
        self.gtval = 1 if not gtdf.empty else 0
        self.benchval = 1 if not benchdf.empty else 0



    def computePrecisionRecall(self):
        """
        1. Iterate over gtdf
        2. For every row in gtdf, find a row in benchdf where alertframe is between start and end frame
            if found, increment tp
            else, increment fn
        :return:
        """
        total_true_events = 1 if self.gtval == 1 else 0
        tp = 1 if self.gtval == 1 and self.benchval == 1 else 0 
        tn = 1 if self.gtval == 0 and self.benchval == 0 else 0
        fp = 1 if self.gtval == 0 and self.benchval == 1 else 0
        fn = 1 if self.gtval == 1 and self.benchval == 0 else 0

        precision = tp / (tp + fp) if tp + fp > 0 else -1
        recall = tp / total_true_events if total_true_events > 0 else -1

        return total_true_events, tp, fp, fn, precision, recall


def read_json_file(file_path):
    """
    Reads a JSON file from the given path, constructs the path to info.json (contains input trip videos details),
    fetches 'GROUND_TRUTH' and 'MP4FILE', converts the .mp4 to .csv (assuming output CSV file of executable has same name),
    and returns the full paths to ground truth and executable output CSV.

    :param file_path: Path to the main config JSON.
    :return: Tuple (finalGroundTruthPath, finalOutputCSVPath)
    """
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"No such file found: {file_path}")
    
    if not file_path.endswith(".json"):
        raise ValueError("Provided file is not a .json file")

    with open(file_path, 'r', encoding='utf-8') as f:
        config = json.load(f)

    lm_build_base = config.get("lmBuildBase")
    lm_input_trips_base = config.get("lmVideoDataBase")
    selected_video_data = config.get("selectedVideoData")
    repo_details = config.get("repositoryDetailsConfig")

    if not lm_build_base or not lm_input_trips_base or not selected_video_data or not repo_details:
        raise ValueError("lm_build_base, lm_input_trips_base, selected_video_data, and repositoryDetailsConfig must be present in config")

    section_name = repo_details.get("section")
    git_reference = repo_details.get("gitReference")
    preset_config = repo_details.get("presetConfig")

    if not isinstance(preset_config, dict):
        raise ValueError("presetConfig must be a dictionary")

    preset_name = preset_config.get("name")
    trip_rel_path = selected_video_data.get("path")
    trip_dir = os.path.join(lm_input_trips_base, trip_rel_path)

    info_json_path = os.path.join(trip_dir,selected_video_data.get("configFileName"))
    if not os.path.isfile(info_json_path):
        raise FileNotFoundError(f"info.json not found at {info_json_path}")

    with open(info_json_path, 'r', encoding='utf-8') as f:
        info_data = json.load(f)

     # Get H264 and Ground Truth file names directly from metadata
    mp4_file = info_data.get("MP4FILE")
    ground_truth_file = info_data.get("GROUND_TRUTH")

    if not mp4_file:
        raise ValueError("MP4FILE not found in metadata")
    if not ground_truth_file:
        raise ValueError("GROUND_TRUTH not found in metadata")

    csv_file = mp4_file.replace(".mp4", ".csv")

    executable_output_sub_path = f"{section_name}_{git_reference}_{preset_name}"
    final_ground_truth_path = os.path.join(trip_dir, ground_truth_file)
    final_output_csv_path = os.path.join(lm_build_base, executable_output_sub_path, trip_rel_path, csv_file)

    return final_ground_truth_path, final_output_csv_path



def parse_command_line():
    parser = argparse.ArgumentParser(description="Compare Ground Truth with Output of Trip Simulation")
    parser.add_argument("-i1", "--comparison_script_input", help="Path of the C1 input file", required=True)
    return parser.parse_args()

if __name__=="__main__":
    args = parse_command_line()

    """ 
     args.comparison_script_input json object example:
    """

    if not args.comparison_script_input:
        print("Please provide path of the C1 input file")
        exit()

    ground_truth, benchmark = read_json_file(args.comparison_script_input)

    tripSimAnalyser = TripSimAnalyser(ground_truth, benchmark)
    total_true_events, tp, fp, fn, precision, recall = tripSimAnalyser.computePrecisionRecall()
    log_line = (f"total_true_events: {total_true_events}, tp: {tp}, fp: {fp}, fn: {fn}, precision: {precision}, recall: {recall}")
    print(log_line)
    with open("C1_output.txt", "w") as file:
        file.write(log_line)
