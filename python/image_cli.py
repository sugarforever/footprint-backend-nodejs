#!/usr/bin/python

'''

Image CLI - provide image processing functionality
1. Image resizing

'''
import sys
import Image

if __name__ == "__main__":

    raw_image_list = sys.argv
    for raw_image in raw_image_list:
        print raw_image
